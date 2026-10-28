import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { AIClientService } from './ai-client.service';
import {
  DocumentTemplate,
  DocumentConversation,
  GeneratedDocument,
  RiskAssessment,
  ChatMessage,
  TemplateSection,
  TemplateField,
  SectionAnswers,
} from '../database/database.types';
import { StartConversationDto, SubmitAnswerDto, AIResponseDto } from './dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private databaseService: DatabaseService,
    private aiClientService: AIClientService,
  ) {}

  /**
   * Start a new AI conversation for a document
   */
  async startConversation(
    userId: string,
    documentId: string,
    dto: StartConversationDto,
  ): Promise<{
    conversationId: string;
    messages: ChatMessage[];
    currentSection: any;
    sections: Array<{ sectionId: string; sectionNumber: number; title: string; emoji: string }>;
    completedSections: string[];
    isResuming: boolean;
  }> {
    this.logger.log(`Starting conversation for document ${documentId}`);

    // Verify document exists and belongs to user
    const document = await this.getDocument(documentId, userId);

    // ── Check for prior answers (for auto-resume) ────────────────────────────────
    // Query the most recently created conversation for this document regardless of status
    const priorResult = await this.databaseService.query<DocumentConversation>(
      `SELECT answers, completed_sections, context FROM document_conversations
       WHERE document_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [documentId],
    );

    let inheritedAnswers: Record<string, any> = {};
    let inheritedCompletedSections: string[] = [];
    let isResuming = false;

    if (priorResult.rows.length > 0) {
      const prior = priorResult.rows[0];
      const hasAnswers =
        prior.answers &&
        Object.values(prior.answers as Record<string, any>).some(
          (s: any) => s && Object.keys(s).length > 0,
        );
      if (hasAnswers) {
        inheritedAnswers = prior.answers as Record<string, any>;
        inheritedCompletedSections = (prior.completed_sections as string[]) || [];
        isResuming = true;
      }
    }

    // Check for existing active conversation and abandon it
    const existingConversation = await this.databaseService.query<DocumentConversation>(
      `SELECT id FROM document_conversations 
       WHERE document_id = $1 AND status = 'active' 
       LIMIT 1`,
      [documentId],
    );

    if (existingConversation.rows.length > 0) {
      this.logger.log(`Abandoning existing conversation ${existingConversation.rows[0].id} for document ${documentId}`);
      await this.databaseService.query(
        `UPDATE document_conversations 
         SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [existingConversation.rows[0].id],
      );
    }

    // Load template structure
    const template = await this.getTemplate(dto.templateId);

    if (!template.structure?.sections || template.structure.sections.length === 0) {
      throw new BadRequestException('Template has no sections defined');
    }

    // Load assessment context if provided
    let assessmentContext: any = {};
    if (dto.assessmentId) {
      const assessment = await this.getAssessment(dto.assessmentId, userId);
      assessmentContext = {
        orgName: assessment.org_name || 'Organization',
        assessmentId: dto.assessmentId,
        assessmentTier: assessment.risk_tier,
        geography: assessment.q2_geography,
      };
    } else if (document.assessment_id) {
      // Fall back to document's assessment if available
      const assessment = await this.getAssessment(document.assessment_id, userId);
      assessmentContext = {
        orgName: assessment.org_name || 'Organization',
        assessmentId: document.assessment_id,
        assessmentTier: assessment.risk_tier,
        geography: assessment.q2_geography,
      };
    }

    // Create conversation
    const conversationId = randomUUID();

    // ── Determine start section (fresh vs resume) ─────────────────────────────────
    let startSection: TemplateSection;
    let startSectionIndex: number;

    if (isResuming) {
      const resumeResult = this.findResumeSection(template, inheritedCompletedSections, inheritedAnswers);
      startSection = resumeResult.section;
      startSectionIndex = resumeResult.sectionIndex;
    } else {
      startSection = template.structure.sections[0];
      startSectionIndex = 0;
    }

    const startField = startSection.fields?.find(Boolean) ?? null;
    if (!startField) {
      throw new BadRequestException('Start section has no fields');
    }

    const welcomeContent = isResuming && startSectionIndex > 0
      ? `Welcome back! You've completed **${inheritedCompletedSections.length}** of **${template.structure.sections.length}** sections. Picking up from **${startSection.title}**. 👋`
      : `Hi! I'll help you complete the ${template.name}. This usually takes about ${template.structure.metadata?.totalEstimatedTime || '10-15 minutes'}. Let's start with **${startSection.title}**.`;

    const welcomeMessage: ChatMessage = {
      id: randomUUID(),
      role: 'ai',
      content: welcomeContent,
      timestamp: new Date().toISOString(),
      type: 'intro',
    };

    // Generate grouped opening question — exclude already-answered fields when resuming
    const startSectionAnswers = inheritedAnswers[startSection.sectionId] || {};
    const allStartSectionFields = (startSection.fields || []).filter(f => {
      if (this.shouldSkipField(f, startSectionAnswers)) return false;
      // When resuming, skip fields that already have a non-empty answer
      if (isResuming) {
        const val = startSectionAnswers[f.fieldId];
        return val === undefined || val === null;
      }
      return true;
    });

    // Fall back to all non-conditional fields if everything is filled (edge case)
    const fieldsForFirstQuestion =
      allStartSectionFields.length > 0
        ? allStartSectionFields.slice(0, 3)
        : (startSection.fields || []).filter(f => !this.shouldSkipField(f, startSectionAnswers)).slice(0, 3);

    const firstQuestion = await this.aiClientService.generateGroupedQuestion(
      conversationId,
      startSection,
      fieldsForFirstQuestion,
      startSectionAnswers,
      inheritedCompletedSections,
      {
        ...assessmentContext,
        templateId: dto.templateId,
        documentId,
      },
    );

    const aiQuestionMessage: ChatMessage = {
      id: randomUUID(),
      role: 'ai',
      content: firstQuestion.content,
      timestamp: new Date().toISOString(),
      type: 'question',
      metadata: { sectionId: startSection.sectionId },
    };

    const initialProgress = Math.round((inheritedCompletedSections.length / template.structure.sections.length) * 100);

    const conversation: Partial<DocumentConversation> = {
      id: conversationId,
      user_id: userId,
      document_id: documentId,
      template_id: dto.templateId,
      assessment_id: dto.assessmentId || document.assessment_id,
      current_section_id: startSection.sectionId,
      current_section_index: startSectionIndex,
      current_field_id: startField.fieldId,
      answers: inheritedAnswers,
      completed_sections: inheritedCompletedSections,
      messages: [welcomeMessage, aiQuestionMessage],
      status: 'active',
      progress_percentage: initialProgress,
      context: {
        ...assessmentContext,
        templateId: dto.templateId,
        documentId,
        pendingFieldIds: firstQuestion.targetFieldIds,
        fieldAttempts: {},
      },
    };

    // Insert into database
    await this.saveConversation(conversation as DocumentConversation);

    // Update document to link conversation
    await this.databaseService.query(
      'UPDATE generated_documents SET conversation_id = $1, creation_mode = $2 WHERE id = $3',
      [conversationId, 'ai_assisted', documentId],
    );

    this.logger.log(`Conversation ${conversationId} started successfully (isResuming=${isResuming})`);

    return {
      conversationId,
      messages: [welcomeMessage, aiQuestionMessage] as ChatMessage[],
      currentSection: {
        sectionId: startSection.sectionId,
        sectionNumber: startSection.sectionNumber,
        title: startSection.title,
        emoji: startSection.emoji,
        totalSections: template.structure.sections.length,
      },
      sections: template.structure.sections.map(s => ({
        sectionId: s.sectionId,
        sectionNumber: s.sectionNumber,
        title: s.title,
        emoji: s.emoji,
      })),
      completedSections: inheritedCompletedSections,
      isResuming,
    };
  }

  /**
   * Submit a free-text message (conversational grouped mode).
   * Handles skip intent, attempt tracking, and graceful fallback to
   * single-field direct questions when Python extraction keeps failing.
   */
  async submitMessage(
    conversationId: string,
    userId: string,
    message: string,
  ): Promise<{
    success: boolean;
    aiMessage: ChatMessage;
    sectionUpdate?: { sectionId: string; markdown: string; action: 'replace' | 'append' };
    currentSection?: { sectionId: string; sectionNumber: number; title: string; emoji: string } | null;
    conversationStatus?: string;
    progress: any;
  }> {
    this.logger.log(`submitMessage for conversation ${conversationId}`);

    const conversation = await this.getConversation(conversationId, userId);
    const template = await this.getTemplate(conversation.template_id);
    const currentSection = this.findSection(template, conversation.current_section_id);

    if (!currentSection) throw new BadRequestException('Current section not found');

    // Record user message
    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'answer',
    };
    conversation.messages.push(userMessage);

    // ── Context helpers ────────────────────────────────────────────────────────
    const pendingFieldIds: string[] = conversation.context?.pendingFieldIds || [];
    /** How many times each field has been asked without a successful extraction */
    const fieldAttempts: Record<string, number> = conversation.context?.fieldAttempts || {};

    // Get the fields currently being asked about
    const pendingFields: TemplateField[] = pendingFieldIds
      .map(id => currentSection.fields.find(f => f.fieldId === id))
      .filter(Boolean) as TemplateField[];

    const sectionAnswers = conversation.answers[currentSection.sectionId] || {};

    // All unanswered non-skipped fields in the section
    const allRemaining = currentSection.fields.filter(f => {
      if (this.shouldSkipField(f, sectionAnswers)) return false;
      const val = sectionAnswers[f.fieldId];
      return val === undefined || val === null || val === '';
    });

    // If no pending fields tracked, target everything remaining
    const targetFields = pendingFields.length > 0 ? pendingFields : allRemaining;

    // ── Skip intent detection ──────────────────────────────────────────────────
    // Keywords that signal the user wants to move past optional fields
    const SKIP_RE = /\b(skip|next|already|move on|ignore|pass|continue|done|that.{0,5}fine|go ahead)\b/i;
    const isSkipIntent = SKIP_RE.test(message) && message.trim().length < 60;

    if (!conversation.answers[currentSection.sectionId]) {
      conversation.answers[currentSection.sectionId] = {};
    }

    if (isSkipIntent) {
      // Mark all optional pending fields as explicitly skipped (empty string = answered)
      for (const field of targetFields) {
        if (!field.required) {
          conversation.answers[currentSection.sectionId][field.fieldId] = '';
        }
      }
      // Reset attempt counter for these fields
      for (const field of targetFields) delete fieldAttempts[field.fieldId];
    } else {
      // ── Extraction ────────────────────────────────────────────────────────────
      const extraction = await this.aiClientService.extractFieldValues(
        conversation.id,
        message,
        targetFields,
        currentSection,
        sectionAnswers,
        conversation.context,
      );

      // Store successfully extracted values
      for (const [fieldId, value] of Object.entries(extraction.fieldValues)) {
        if (value !== null && value !== undefined && value !== '') {
          conversation.answers[currentSection.sectionId][fieldId] = value;
          delete fieldAttempts[fieldId]; // Success — reset counter
        }
      }

      // Increment attempt counter for fields that were not extracted
      for (const field of targetFields) {
        if (!extraction.fieldValues[field.fieldId]) {
          fieldAttempts[field.fieldId] = (fieldAttempts[field.fieldId] || 0) + 1;
        }
      }
    }

    conversation.context.fieldAttempts = fieldAttempts;

    // ── Recalculate remaining ──────────────────────────────────────────────────
    const answeredInSection = conversation.answers[currentSection.sectionId];
    const remainingFields = currentSection.fields.filter(f => {
      if (this.shouldSkipField(f, answeredInSection)) return false;
      const val = answeredInSection[f.fieldId];
      return val === undefined || val === null || val === '';
    });

    let aiMessage: ChatMessage;
    let sectionUpdate: any = null;
    let nextSectionInfo: any = null;

    if (remainingFields.length > 0) {
      // ── Determine whether to ask directly (stubborn field) or in a group ──
      const MAX_GROUP_SIZE = 3;

      // Fields that have been attempted >= 2 times without resolution
      const stubbornFields = remainingFields.filter(f => (fieldAttempts[f.fieldId] || 0) >= 2);

      let fieldsToAsk: TemplateField[];
      let directMode = false;

      if (stubbornFields.length > 0) {
        // Ask only the first stubborn field directly — use its own aiQuestion, no Python
        fieldsToAsk = [stubbornFields[0]];
        directMode = true;
        // Reset its attempt counter so we don't loop on it forever
        fieldAttempts[stubbornFields[0].fieldId] = 0;
        conversation.context.fieldAttempts = fieldAttempts;
      } else {
        // Cap group size so Python extraction stays reliable
        fieldsToAsk = remainingFields.slice(0, MAX_GROUP_SIZE);
        directMode = false;
      }

      let questionContent: string;
      let questionTargetIds: string[];

      if (directMode) {
        // Use the field's own aiQuestion directly — no Python call
        const f = fieldsToAsk[0];
        questionContent = f.aiQuestion || `What is the ${f.label}?`;
        if (f.options?.length) questionContent += ` (Options: ${f.options.join(', ')})`;
        questionTargetIds = [f.fieldId];
      } else {
        const questionResponse = await this.aiClientService.generateGroupedQuestion(
          conversation.id,
          currentSection,
          fieldsToAsk,
          answeredInSection,
          conversation.completed_sections,
          conversation.context,
        );
        questionContent = questionResponse.content;
        questionTargetIds = questionResponse.targetFieldIds;
      }

      conversation.context.pendingFieldIds = questionTargetIds;

      aiMessage = {
        id: randomUUID(),
        role: 'ai',
        content: questionContent,
        timestamp: new Date().toISOString(),
        type: 'question',
        metadata: { sectionId: currentSection.sectionId },
      };
    } else {
      // ── Section complete ───────────────────────────────────────────────────
      const markdown = this.generateSectionMarkdown(
        currentSection,
        answeredInSection,
        conversation.context,
      );

      const nextSectionIndex = conversation.current_section_index + 1;
      const nextSectionForTransition = nextSectionIndex < template.structure.sections.length
        ? template.structure.sections[nextSectionIndex]
        : null;

      const transitionResponse = await this.aiClientService.generateTransition(
        conversation.id,
        currentSection,
        nextSectionForTransition,
        conversation.completed_sections,
        conversation.context,
      );

      conversation.completed_sections.push(currentSection.sectionId);
      sectionUpdate = { sectionId: currentSection.sectionId, markdown, action: 'replace' as const };

      // Reset attempt counters for next section
      conversation.context.fieldAttempts = {};

      if (nextSectionForTransition) {
        conversation.current_section_id = nextSectionForTransition.sectionId;
        conversation.current_section_index = nextSectionIndex;
        if (nextSectionForTransition.fields?.length > 0) {
          conversation.current_field_id = nextSectionForTransition.fields[0].fieldId;
        }

        const nextAllFields = (nextSectionForTransition.fields || []).filter(
          f => !this.shouldSkipField(f, {}),
        );
        // Cap first question to 3 fields
        const nextFirstGroup = nextAllFields.slice(0, 3);
        const nextQuestion = await this.aiClientService.generateGroupedQuestion(
          conversation.id,
          nextSectionForTransition,
          nextFirstGroup,
          {},
          conversation.completed_sections,
          conversation.context,
        );
        conversation.context.pendingFieldIds = nextQuestion.targetFieldIds;

        nextSectionInfo = {
          sectionId: nextSectionForTransition.sectionId,
          sectionNumber: nextSectionForTransition.sectionNumber,
          title: nextSectionForTransition.title,
          emoji: nextSectionForTransition.emoji,
        };

        aiMessage = {
          id: randomUUID(),
          role: 'ai',
          content: `${transitionResponse.content}\n\n${nextQuestion.content}`,
          timestamp: new Date().toISOString(),
          type: 'transition',
          metadata: { sectionId: nextSectionForTransition.sectionId },
        };
      } else {
        conversation.status = 'completed';
        conversation.progress_percentage = 100;
        conversation.context.pendingFieldIds = [];

        aiMessage = {
          id: randomUUID(),
          role: 'ai',
          content: transitionResponse.content,
          timestamp: new Date().toISOString(),
          type: 'completion',
          metadata: { sectionId: currentSection.sectionId },
        };
      }
    }

    conversation.messages.push(aiMessage);
    conversation.progress_percentage = this.calculateProgressPercentage(conversation, template);

    await this.updateConversation(conversationId, conversation);

    if (sectionUpdate) {
      await this.mergeSection(conversation.document_id, sectionUpdate.sectionId, sectionUpdate.markdown);
    }

    return {
      success: true,
      aiMessage,
      sectionUpdate,
      currentSection: nextSectionInfo,
      conversationStatus: conversation.status,
      progress: this.calculateProgress(conversation, template),
    };
  }

  /**
   * Submit an answer and get next question or section update (legacy single-field mode)
   */
  async submitAnswer(
    conversationId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<{
    success: boolean;
    aiMessage: ChatMessage;
    nextField?: any;
    sectionUpdate?: {
      sectionId: string;
      markdown: string;
      action: 'replace' | 'append';
    };
    currentSection?: {
      sectionId: string;
      sectionNumber: number;
      title: string;
      emoji: string;
    } | null;
    conversationStatus?: string;
    progress: any;
  }> {
    this.logger.log(`Submitting answer for conversation ${conversationId}`);

    // Load conversation
    const conversation = await this.getConversation(conversationId, userId);
    const template = await this.getTemplate(conversation.template_id);
    const currentSection = this.findSection(template, conversation.current_section_id);

    if (!currentSection) {
      throw new BadRequestException('Current section not found');
    }

    // Validate field exists in current section
    const field = currentSection.fields.find(f => f.fieldId === dto.fieldId);
    if (!field) {
      throw new BadRequestException(`Field ${dto.fieldId} not found in current section`);
    }

    // Validate answer
    const validationError = this.validateFieldAnswer(field, dto.value);
    if (validationError) {
      const errorMessage: ChatMessage = {
        id: randomUUID(),
        role: 'ai',
        content: validationError,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata: { fieldId: dto.fieldId },
      };

      conversation.messages.push(errorMessage);
      await this.updateConversation(conversationId, { messages: conversation.messages });

      return {
        success: false,
        aiMessage: errorMessage,
        nextField: this.serializeField(field),
        progress: this.calculateProgress(conversation, template),
      };
    }

    // Store answer
    if (!conversation.answers[currentSection.sectionId]) {
      conversation.answers[currentSection.sectionId] = {};
    }
    conversation.answers[currentSection.sectionId][dto.fieldId] = dto.value;

    // Add user message
    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: this.formatAnswerForDisplay(dto.value),
      timestamp: new Date().toISOString(),
      type: 'answer',
      metadata: { fieldId: dto.fieldId, sectionId: currentSection.sectionId },
    };
    conversation.messages.push(userMessage);

    // Find next field in section
    const currentFieldIndex = currentSection.fields.findIndex(f => f.fieldId === dto.fieldId);
    const nextFieldIndex = currentFieldIndex + 1;

    let aiMessage: ChatMessage;
    let nextField: any = null;
    let sectionUpdate: any = null;

    if (nextFieldIndex < currentSection.fields.length) {
      // Find next field in this section, skipping fields with unmet dependencies
      let nextFieldObj = currentSection.fields[nextFieldIndex];
      let searchIndex = nextFieldIndex;
      
      // Loop through fields to find the next valid one
      while (searchIndex < currentSection.fields.length) {
        nextFieldObj = currentSection.fields[searchIndex];
        
        // Check if this field should be skipped due to dependencies
        if (!this.shouldSkipField(nextFieldObj, conversation.answers[currentSection.sectionId])) {
          // Found a valid field
          break;
        }
        
        searchIndex++;
      }

      // If we found a valid field, continue in this section
      if (searchIndex < currentSection.fields.length) {
        conversation.current_field_id = nextFieldObj.fieldId;

        // Call Python AI service to generate contextual question
        const aiResponse = await this.aiClientService.generateFieldQuestion(
          conversation.id,
          currentSection,
          nextFieldObj,
          conversation.answers[currentSection.sectionId] || {},
          conversation.completed_sections,
          conversation.context,
          dto.value?.toString(),
        );

        aiMessage = {
          id: randomUUID(),
          role: 'ai',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
          type: 'question',
          metadata: {
            fieldId: nextFieldObj.fieldId,
            sectionId: currentSection.sectionId,
            aiMetadata: aiResponse.metadata,
          },
        };

        nextField = this.serializeField(nextFieldObj);
      } else {
        // All remaining fields are skipped, treat section as complete
        const markdown = this.generateSectionMarkdown(
          currentSection,
          conversation.answers[currentSection.sectionId],
          conversation.context,
        );

        // Pre-compute next section so LLM can introduce it in the transition message
        const nextSectionIndex = conversation.current_section_index + 1;
        const nextSectionForTransition = nextSectionIndex < template.structure.sections.length
          ? template.structure.sections[nextSectionIndex]
          : null;

        // Generate transition message using AI (with next section context)
        const aiResponse = await this.aiClientService.generateTransition(
          conversation.id,
          currentSection,
          nextSectionForTransition,
          conversation.completed_sections,
          conversation.context,
        );

        aiMessage = {
          id: randomUUID(),
          role: 'ai',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
          type: 'transition',
          metadata: {
            sectionId: currentSection.sectionId,
            aiMetadata: aiResponse.metadata,
          },
        };

        conversation.completed_sections.push(currentSection.sectionId);

        sectionUpdate = {
          sectionId: currentSection.sectionId,
          markdown,
          action: 'replace' as const,
        };

        // Move to next section
        if (nextSectionForTransition) {
          conversation.current_section_id = nextSectionForTransition.sectionId;
          conversation.current_section_index = nextSectionIndex;

          if (nextSectionForTransition.fields && nextSectionForTransition.fields.length > 0) {
            conversation.current_field_id = nextSectionForTransition.fields[0].fieldId;
            // Return the first field of the next section so the frontend shows the input
            nextField = this.serializeField(nextSectionForTransition.fields[0]);
          }
        } else {
          // All sections complete
          conversation.status = 'completed';
        }
      }
    } else {
      // Section complete - generate markdown
      const markdown = this.generateSectionMarkdown(
        currentSection,
        conversation.answers[currentSection.sectionId],
        conversation.context,
      );

      // Pre-compute next section so LLM can introduce it in the transition message
      const nextSectionIndex = conversation.current_section_index + 1;
      const nextSectionForTransition = nextSectionIndex < template.structure.sections.length
        ? template.structure.sections[nextSectionIndex]
        : null;

      // Generate transition message using AI (with next section context)
      const aiResponse = await this.aiClientService.generateTransition(
        conversation.id,
        currentSection,
        nextSectionForTransition,
        conversation.completed_sections,
        conversation.context,
      );

      // Add completion message
      aiMessage = {
        id: randomUUID(),
        role: 'ai',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        type: 'transition',
        metadata: {
          sectionId: currentSection.sectionId,
          aiMetadata: aiResponse.metadata,
        },
      };

      conversation.completed_sections.push(currentSection.sectionId);

      sectionUpdate = {
        sectionId: currentSection.sectionId,
        markdown,
        action: 'replace' as const,
      };

      // Move to next section
      if (nextSectionForTransition) {
        conversation.current_section_id = nextSectionForTransition.sectionId;
        conversation.current_section_index = nextSectionIndex;

        if (nextSectionForTransition.fields && nextSectionForTransition.fields.length > 0) {
          conversation.current_field_id = nextSectionForTransition.fields[0].fieldId;
          // Return the first field of the next section so the frontend shows the input
          nextField = this.serializeField(nextSectionForTransition.fields[0]);
        }
      } else {
        // All sections complete
        conversation.status = 'completed';
        conversation.progress_percentage = 100;
      }
    }

    conversation.messages.push(aiMessage);
    conversation.progress_percentage = this.calculateProgressPercentage(conversation, template);

    await this.updateConversation(conversationId, conversation);

    // Update document content if section complete
    if (sectionUpdate) {
      await this.mergeSection(conversation.document_id, sectionUpdate.sectionId, sectionUpdate.markdown);
    }

    // Build response — include the active section so the frontend can update its header
    const activeSectionObj = this.findSection(template, conversation.current_section_id);

    return {
      success: true,
      aiMessage,
      nextField,
      sectionUpdate,
      // Current section info (may have changed after a section transition)
      currentSection: activeSectionObj
        ? {
            sectionId: activeSectionObj.sectionId,
            sectionNumber: activeSectionObj.sectionNumber,
            title: activeSectionObj.title,
            emoji: activeSectionObj.emoji,
          }
        : null,
      conversationStatus: conversation.status,
      progress: this.calculateProgress(conversation, template),
    };
  }

  /**
   * Get conversation state
   */
  async getConversationState(conversationId: string, userId: string): Promise<any> {
    const conversation = await this.getConversation(conversationId, userId);
    const template = await this.getTemplate(conversation.template_id);
    const currentSection = this.findSection(template, conversation.current_section_id);

    return {
      conversationId: conversation.id,
      status: conversation.status,
      currentSection: currentSection
        ? {
            sectionId: currentSection.sectionId,
            sectionNumber: currentSection.sectionNumber,
            title: currentSection.title,
            emoji: currentSection.emoji,
          }
        : null,
      completedSections: conversation.completed_sections,
      messages: conversation.messages,
      answers: conversation.answers,
      progress: this.calculateProgress(conversation, template),
    };
  }

  /**
   * Pause conversation
   */
  async pauseConversation(conversationId: string, userId: string): Promise<void> {
    await this.getConversation(conversationId, userId); // Verify ownership
    await this.updateConversation(conversationId, { status: 'paused' });
    this.logger.log(`Conversation ${conversationId} paused`);
  }

  /**
   * Resume conversation
   */
  async resumeConversation(conversationId: string, userId: string): Promise<any> {
    const conversation = await this.getConversation(conversationId, userId);
    
    if (conversation.status === 'completed') {
      throw new BadRequestException('Conversation is already completed');
    }

    await this.updateConversation(conversationId, { status: 'active' });
    return this.getConversationState(conversationId, userId);
  }

  /**
   * Jump to a specific section (for editing / reviewing).
   * Existing answers for that section are kept as defaults and shown to the user;
   * the section is removed from completed_sections so it can be re-completed.
   */
  async jumpToSection(
    conversationId: string,
    userId: string,
    sectionId: string,
  ): Promise<{
    success: boolean;
    aiMessage: ChatMessage;
    currentSection: { sectionId: string; sectionNumber: number; title: string; emoji: string };
    updatedCompletedSections: string[];
  }> {
    const conversation = await this.getConversation(conversationId, userId);

    // Allow jumping even on completed conversations (re-opens them)
    if (conversation.status === 'completed') {
      await this.updateConversation(conversationId, { status: 'active' });
      conversation.status = 'active';
    }

    if (conversation.status !== 'active' && conversation.status !== 'paused') {
      throw new BadRequestException('Conversation must be active or paused to jump sections');
    }

    const template = await this.getTemplate(conversation.template_id);
    const targetSection = this.findSection(template, sectionId);

    if (!targetSection) {
      throw new BadRequestException(`Section ${sectionId} not found in template`);
    }

    const targetSectionIndex = template.structure.sections.findIndex(s => s.sectionId === sectionId);
    const existingAnswers = conversation.answers[sectionId] || {};

    // Keep existing answers — only re-ask fields that are still unanswered
    const remainingFields = (targetSection.fields || []).filter(f => {
      if (this.shouldSkipField(f, existingAnswers)) return false;
      const val = existingAnswers[f.fieldId];
      return val === undefined || val === null || val === '';
    });

    // Remove from completed_sections so it can be re-submitted
    conversation.completed_sections = conversation.completed_sections.filter(s => s !== sectionId);

    // Navigate to the target section
    conversation.current_section_id = sectionId;
    conversation.current_section_index = targetSectionIndex;
    if (targetSection.fields?.length > 0) {
      conversation.current_field_id = targetSection.fields[0].fieldId;
    }
    conversation.context.fieldAttempts = {};

    // Build a summary of what was already answered
    const answeredFields = (targetSection.fields || []).filter(
      f =>
        existingAnswers[f.fieldId] !== undefined &&
        existingAnswers[f.fieldId] !== null &&
        existingAnswers[f.fieldId] !== '',
    );
    const summaryLines = answeredFields
      .map(f => `• **${f.label}:** ${this.formatAnswerForDisplay(existingAnswers[f.fieldId])}`)
      .join('\n');

    // If everything was already answered, clear answers so they're fully re-collected
    const fieldsToAsk =
      remainingFields.length > 0
        ? remainingFields.slice(0, 3)
        : (targetSection.fields || []).filter(f => !this.shouldSkipField(f, existingAnswers)).slice(0, 3);

    if (remainingFields.length === 0) {
      conversation.answers[sectionId] = {};
    }

    const questionResponse = await this.aiClientService.generateGroupedQuestion(
      conversationId,
      targetSection,
      fieldsToAsk,
      remainingFields.length > 0 ? existingAnswers : {},
      conversation.completed_sections,
      conversation.context,
    );

    conversation.context.pendingFieldIds = questionResponse.targetFieldIds;

    let aiContent: string;
    if (summaryLines && remainingFields.length > 0) {
      aiContent = `Sure! For **${targetSection.title}**, here's what you've already provided:\n\n${summaryLines}\n\nLet's fill in the remaining fields. ${questionResponse.content}`;
    } else if (summaryLines) {
      aiContent = `Let's revisit **${targetSection.title}**. Here's what you provided before:\n\n${summaryLines}\n\n${questionResponse.content}`;
    } else {
      aiContent = `Let's go to **${targetSection.title}**. ${questionResponse.content}`;
    }

    const aiMessage: ChatMessage = {
      id: randomUUID(),
      role: 'ai',
      content: aiContent,
      timestamp: new Date().toISOString(),
      type: 'transition',
      metadata: { sectionId },
    };

    conversation.messages.push(aiMessage);
    await this.updateConversation(conversationId, conversation);

    return {
      success: true,
      aiMessage,
      currentSection: {
        sectionId: targetSection.sectionId,
        sectionNumber: targetSection.sectionNumber,
        title: targetSection.title,
        emoji: targetSection.emoji,
      },
      updatedCompletedSections: conversation.completed_sections,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper Methods
  // ═══════════════════════════════════════════════════════════════════════════

  private async getTemplate(templateId: string): Promise<DocumentTemplate> {
    const result = await this.databaseService.query(
      'SELECT * FROM document_templates WHERE id = $1 AND is_active = true',
      [templateId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return result.rows[0];
  }

  private async getDocument(documentId: string, userId: string): Promise<GeneratedDocument> {
    const result = await this.databaseService.query(
      'SELECT * FROM generated_documents WHERE id = $1',
      [documentId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const document = result.rows[0];

    if (document.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  private async getAssessment(assessmentId: string, userId: string): Promise<RiskAssessment> {
    const result = await this.databaseService.query(
      'SELECT * FROM risk_assessments WHERE id = $1',
      [assessmentId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    const assessment = result.rows[0];

    if (assessment.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this assessment');
    }

    return assessment;
  }

  private async getConversation(conversationId: string, userId: string): Promise<DocumentConversation> {
    const result = await this.databaseService.query(
      'SELECT * FROM document_conversations WHERE id = $1',
      [conversationId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const conversation = result.rows[0];

    if (conversation.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  private async saveConversation(conversation: DocumentConversation): Promise<void> {
    await this.databaseService.query(
      `INSERT INTO document_conversations 
       (id, user_id, document_id, template_id, assessment_id, current_section_id, 
        current_section_index, current_field_id, answers, completed_sections, messages, 
        status, progress_percentage, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        conversation.id,
        conversation.user_id,
        conversation.document_id,
        conversation.template_id,
        conversation.assessment_id || null,
        conversation.current_section_id,
        conversation.current_section_index,
        conversation.current_field_id,
        JSON.stringify(conversation.answers),
        conversation.completed_sections,
        JSON.stringify(conversation.messages),
        conversation.status,
        conversation.progress_percentage,
        JSON.stringify(conversation.context),
      ],
    );
  }

  private async updateConversation(conversationId: string, updates: Partial<DocumentConversation>): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.current_section_id !== undefined) {
      setClauses.push(`current_section_id = $${paramIndex++}`);
      values.push(updates.current_section_id);
    }

    if (updates.current_section_index !== undefined) {
      setClauses.push(`current_section_index = $${paramIndex++}`);
      values.push(updates.current_section_index);
    }

    if (updates.current_field_id !== undefined) {
      setClauses.push(`current_field_id = $${paramIndex++}`);
      values.push(updates.current_field_id);
    }

    if (updates.answers !== undefined) {
      setClauses.push(`answers = $${paramIndex++}`);
      values.push(JSON.stringify(updates.answers));
    }

    if (updates.completed_sections !== undefined) {
      setClauses.push(`completed_sections = $${paramIndex++}`);
      values.push(updates.completed_sections);
    }

    if (updates.messages !== undefined) {
      setClauses.push(`messages = $${paramIndex++}`);
      values.push(JSON.stringify(updates.messages));
    }

    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.progress_percentage !== undefined) {
      setClauses.push(`progress_percentage = $${paramIndex++}`);
      values.push(updates.progress_percentage);
    }

    if (updates.context !== undefined) {
      setClauses.push(`context = $${paramIndex++}`);
      values.push(JSON.stringify(updates.context));
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(conversationId);

    const query = `UPDATE document_conversations SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
    await this.databaseService.query(query, values);
  }

  /**
   * Walk the template sections in order and return the first one that still has
   * unanswered required fields — i.e. where the user should resume from.
   * Falls back to the last section if everything appears complete.
   */
  private findResumeSection(
    template: DocumentTemplate,
    completedSections: string[],
    answers: Record<string, any>,
  ): { section: TemplateSection; sectionIndex: number } {
    for (let i = 0; i < template.structure.sections.length; i++) {
      const section = template.structure.sections[i];

      // Already fully completed — skip
      if (completedSections.includes(section.sectionId)) continue;

      const sectionAnswers = answers[section.sectionId] || {};
      const remaining = (section.fields || []).filter(f => {
        if (this.shouldSkipField(f, sectionAnswers)) return false;
        const val = sectionAnswers[f.fieldId];
        // Empty string ('') means explicitly skipped — treat as answered
        return val === undefined || val === null;
      });

      if (remaining.length > 0) {
        return { section, sectionIndex: i };
      }
    }

    // Everything appears answered — resume from the last section
    const lastIndex = template.structure.sections.length - 1;
    return { section: template.structure.sections[lastIndex], sectionIndex: lastIndex };
  }

  private findSection(template: DocumentTemplate, sectionId: string): TemplateSection | null {
    return template.structure.sections.find(s => s.sectionId === sectionId) || null;
  }

  private serializeField(field: TemplateField): any {
    return {
      fieldId: field.fieldId,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      options: field.options,
      helpText: field.helpText,
    };
  }

  private validateFieldAnswer(field: TemplateField, value: any): string | null {
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label} is required. Please provide a value.`;
    }

    if (field.validation) {
      const validation = field.validation;

      if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
        return `${field.label} must be at least ${validation.minLength} characters.`;
      }

      if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
        return `${field.label} must not exceed ${validation.maxLength} characters.`;
      }

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return `${field.label} format is invalid. Please check your input.`;
        }
      }

      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `That doesn't look like a valid email address. Could you try again?`;
        }
      }

      if (field.type === 'url') {
        try {
          new URL(value);
        } catch {
          return `That doesn't look like a valid URL. Please include http:// or https://`;
        }
      }
    }

    return null;
  }

  private shouldSkipField(field: TemplateField, sectionAnswers: any): boolean {
    if (!field.dependsOn) {
      return false;
    }

    const dependentValue = sectionAnswers[field.dependsOn.fieldId];
    const condition = field.dependsOn.condition;
    const requiredValue = field.dependsOn.value;

    switch (condition) {
      case 'equals':
        return dependentValue !== requiredValue;
      case 'notEquals':
        return dependentValue === requiredValue;
      case 'includes':
        return !Array.isArray(dependentValue) || !dependentValue.includes(requiredValue);
      case 'notIncludes':
        return Array.isArray(dependentValue) && dependentValue.includes(requiredValue);
      default:
        return false;
    }
  }

  private formatAnswerForDisplay(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  private generateSectionMarkdown(section: TemplateSection, answers: any, context: any): string {
    let markdown = section.outputTemplate;

    // Replace placeholders with answers
    for (const [fieldId, value] of Object.entries(answers)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
      markdown = markdown.replace(new RegExp(`{{${fieldId}}}`, 'g'), displayValue);
    }

    // Replace context placeholders
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        markdown = markdown.replace(new RegExp(`{{context.${key}}}`, 'g'), String(value));
      }
    }

    // Clean up any remaining placeholders
    markdown = markdown.replace(/{{[^}]+}}/g, '[Not provided]');

    // Add section markers
    return `<!-- SECTION:${section.sectionId}:START -->\n${markdown}\n<!-- SECTION:${section.sectionId}:END -->`;
  }

  private async mergeSection(documentId: string, sectionId: string, markdown: string): Promise<void> {
    const result = await this.databaseService.query('SELECT content FROM generated_documents WHERE id = $1', [
      documentId,
    ]);

    if (result.rows.length === 0) {
      return;
    }

    const currentContent = result.rows[0].content || '';
    const startMarker = `<!-- SECTION:${sectionId}:START -->`;
    const endMarker = `<!-- SECTION:${sectionId}:END -->`;

    let newContent: string;

    const startIndex = currentContent.indexOf(startMarker);

    if (startIndex === -1) {
      // Section doesn't exist, append it
      newContent = currentContent + '\n\n' + markdown;
    } else {
      // Section exists, replace it
      const endIndex = currentContent.indexOf(endMarker, startIndex);
      if (endIndex === -1) {
        throw new Error(`Malformed section markers for ${sectionId}`);
      }

      newContent =
        currentContent.substring(0, startIndex) + markdown + currentContent.substring(endIndex + endMarker.length);
    }

    await this.databaseService.query('UPDATE generated_documents SET content = $1, updated_at = NOW() WHERE id = $2', [
      newContent,
      documentId,
    ]);
  }

  private calculateProgress(conversation: DocumentConversation, template: DocumentTemplate): any {
    const totalSections = template.structure.sections.length;
    const completedSections = conversation.completed_sections.length;
    const currentSectionIndex = conversation.current_section_index;

    return {
      currentSection: currentSectionIndex + 1,
      totalSections,
      completedSections,
      overallPercentage: conversation.progress_percentage,
    };
  }

  private calculateProgressPercentage(conversation: DocumentConversation, template: DocumentTemplate): number {
    const totalSections = template.structure.sections.length;
    const completedSections = conversation.completed_sections.length;

    return Math.round((completedSections / totalSections) * 100);
  }
}
