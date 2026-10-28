import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChatMessage, TemplateSection, TemplateField } from '../database/database.types';

/**
 * Request/Response types for Python AI Service
 */
interface UserMessageDto {
  content: string;
  fieldId?: string;
  sectionId?: string;
}

interface SyncDataDto {
  currentSection: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    description?: string;
    completedFields?: string[];
  };
  nextSection?: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    description?: string;
    firstField?: {
      fieldId: string;
      label: string;
      type: string;
      aiQuestion?: string;
      options?: string[];
    };
  };
  nextField?: {
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
    aiQuestion?: string;
    options?: string[];
    placeholder?: string;
    helpText?: string;
  };
  /** All remaining unanswered fields in the current section */
  remainingFields?: Array<{
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
    aiQuestion?: string;
    options?: string[];
    placeholder?: string;
    helpText?: string;
  }>;
  sectionAnswers: Record<string, any>;
  completedSections: string[];
  context: {
    orgName: string;
    assessmentTier?: string;
    userId?: string;
    documentId?: string;
    templateId?: string;
    [key: string]: any;
  };
}

interface InteractRequestDto {
  conversationId: string;
  action: 'answer_submitted' | 'clarification_request' | 'section_transition' | 'message_submitted' | 'extract_request';
  requestType: 'field_question' | 'section_intro' | 'transition' | 'completion' | 'grouped_question' | 'extract_values';
  userMessage?: UserMessageDto;
  syncData: SyncDataDto;
}

interface InteractResponseDto {
  success: boolean;
  message: string;
  /** Which fields this grouped question is targeting (returned for grouped_question requestType) */
  targetFieldIds?: string[];
  /** Extracted per-field values (returned for extract_values requestType) */
  fieldValues?: Record<string, any>;
  metadata?: {
    mode?: string;
    message_count?: number;
    checkpoint_id?: string;
    [key: string]: any;
  };
}

interface HealthCheckResponse {
  status: string;
  service: string;
  langgraph_version?: string;
}

@Injectable()
export class AIClientService {
  private readonly logger = new Logger(AIClientService.name);
  private readonly pythonApiUrl: string;
  private readonly client: AxiosInstance;
  private readonly timeout: number = 30000; // 30 seconds

  constructor(private configService: ConfigService) {
    this.pythonApiUrl = this.configService.get<string>('PYTHON_AI_SERVICE_URL') || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.pythonApiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`AI Client Service initialized with Python API at ${this.pythonApiUrl}`);
    
    // Test connection on startup
    this.checkHealth().catch(err => {
      this.logger.warn(`Python AI Service not reachable at startup: ${err.message}`);
    });
  }

  /**
   * Check health of Python AI service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      this.logger.log(`Python AI Service health: ${response.data.status}`);
      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate AI response for next field question
   */
  async generateFieldQuestion(
    conversationId: string,
    currentSection: TemplateSection,
    nextField: TemplateField,
    sectionAnswers: Record<string, any>,
    completedSections: string[],
    context: Record<string, any>,
    userAnswer?: string,
  ): Promise<{ content: string; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'answer_submitted',
      requestType: 'field_question',
      userMessage: userAnswer ? {
        content: userAnswer,
        fieldId: nextField.fieldId,
        sectionId: currentSection.sectionId,
      } : undefined,
      syncData: {
        currentSection: {
          sectionId: currentSection.sectionId,
          sectionNumber: currentSection.sectionNumber,
          title: currentSection.title,
          description: currentSection.description,
          completedFields: Object.keys(sectionAnswers),
        },
        nextField: {
          fieldId: nextField.fieldId,
          label: nextField.label,
          type: nextField.type,
          required: nextField.required,
          aiQuestion: nextField.aiQuestion,
          options: nextField.options,
          placeholder: nextField.placeholder,
          helpText: nextField.helpText,
        },
        sectionAnswers,
        completedSections,
        context: {
          orgName: context.orgName || 'the organization',
          assessmentTier: context.assessmentTier,
          userId: context.userId,
          documentId: context.documentId,
          templateId: context.templateId,
          ...context,
        },
      },
    };

    return this.callPythonAPI(request, nextField);
  }

  /**
   * Build a natural grouped question locally from field aiQuestion values.
   * Used as the reliable fallback when Python is unavailable or returns garbage.
   */
  buildLocalGroupedQuestion(fields: TemplateField[]): string {
    if (fields.length === 0) return 'Please provide the remaining details.';

    if (fields.length === 1) {
      const f = fields[0];
      let q = f.aiQuestion || `What is the ${f.label}?`;
      if (f.options?.length) q += ` (Options: ${f.options.join(', ')})`;
      return q;
    }

    // Multiple fields — use each field's aiQuestion and weave them together
    const parts = fields.map((f) => {
      const base = f.aiQuestion || `What is the ${f.label}?`;
      const note = f.required ? '' : ' (optional)';
      const opts = f.options?.length ? ` [${f.options.join(' / ')}]` : '';
      return `• ${base}${note}${opts}`;
    });

    return `I need a few details for this section — feel free to answer in one message:\n\n${parts.join('\n')}`;
  }

  /**
   * Generate a conversational grouped question covering multiple fields at once.
   * Python AI decides how to bundle the remaining fields naturally.
   * Returns { content, targetFieldIds } — which fields this question is asking about.
   */
  async generateGroupedQuestion(
    conversationId: string,
    currentSection: TemplateSection,
    remainingFields: TemplateField[],
    answeredFields: Record<string, any>,
    completedSections: string[],
    context: Record<string, any>,
  ): Promise<{ content: string; targetFieldIds: string[]; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'section_transition',
      requestType: 'grouped_question',
      syncData: {
        currentSection: {
          sectionId: currentSection.sectionId,
          sectionNumber: currentSection.sectionNumber,
          title: currentSection.title,
          description: currentSection.description,
          completedFields: Object.keys(answeredFields),
        },
        remainingFields: remainingFields.map(f => ({
          fieldId: f.fieldId,
          label: f.label,
          type: f.type,
          required: f.required,
          aiQuestion: f.aiQuestion,
          options: f.options,
          placeholder: f.placeholder,
          helpText: f.helpText,
        })),
        sectionAnswers: answeredFields,
        completedSections,
        context: {
          orgName: context.orgName || 'the organization',
          assessmentTier: context.assessmentTier,
          userId: context.userId,
          documentId: context.documentId,
          templateId: context.templateId,
          ...context,
        },
      },
    };

    try {
      const response = await this.client.post<InteractResponseDto>(
        '/api/conversation/interact',
        request,
      );
      if (!response.data.success) throw new Error('grouped_question returned unsuccessful');

      // Reject Python's response if it looks like a generic fallback
      const msg = response.data.message || '';
      const isGenericFallback = /(ready to continue|what would you like|how can I help|please provide information about)/i.test(msg);
      if (isGenericFallback) throw new Error('Python returned generic non-contextual response');

      const targetFieldIds = response.data.targetFieldIds?.length
        ? response.data.targetFieldIds
        : remainingFields.map(f => f.fieldId);

      return {
        content: response.data.message,
        targetFieldIds,
        metadata: response.data.metadata,
      };
    } catch (error) {
      this.logger.warn(`generateGroupedQuestion using local fallback: ${error.message}`);
      // Use reliable local fallback with per-field aiQuestion values
      return {
        content: this.buildLocalGroupedQuestion(remainingFields),
        targetFieldIds: remainingFields.map(f => f.fieldId),
        metadata: { fallback: true },
      };
    }
  }

  /**
   * Ask Python AI to extract per-field values from the user's free-text message.
   * Returns a map of fieldId → extracted value, plus any unresolved fieldIds.
   */
  async extractFieldValues(
    conversationId: string,
    userMessage: string,
    targetFields: TemplateField[],
    currentSection: TemplateSection,
    sectionAnswers: Record<string, any>,
    context: Record<string, any>,
  ): Promise<{ fieldValues: Record<string, any>; unresolved: string[]; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'extract_request',
      requestType: 'extract_values',
      userMessage: { content: userMessage, sectionId: currentSection.sectionId },
      syncData: {
        currentSection: {
          sectionId: currentSection.sectionId,
          sectionNumber: currentSection.sectionNumber,
          title: currentSection.title,
          description: currentSection.description,
          completedFields: Object.keys(sectionAnswers),
        },
        remainingFields: targetFields.map(f => ({
          fieldId: f.fieldId,
          label: f.label,
          type: f.type,
          required: f.required,
          aiQuestion: f.aiQuestion,
          options: f.options,
          placeholder: f.placeholder,
          helpText: f.helpText,
        })),
        sectionAnswers,
        completedSections: [],
        context: {
          orgName: context.orgName || 'the organization',
          ...context,
        },
      },
    };

    try {
      const response = await this.client.post<InteractResponseDto>(
        '/api/conversation/interact',
        request,
      );
      if (!response.data.success) throw new Error('extract_values returned unsuccessful');

      const fieldValues: Record<string, any> = response.data.fieldValues || {};
      const unresolved = targetFields
        .map(f => f.fieldId)
        .filter(id => fieldValues[id] === undefined || fieldValues[id] === null || fieldValues[id] === '');

      return { fieldValues, unresolved, metadata: response.data.metadata };
    } catch (error) {
      this.logger.warn(`extractFieldValues failed, using heuristic fallback: ${error.message}`);
      // Heuristic fallback: if only one target field, assign the whole message to it
      const fieldValues: Record<string, any> = {};
      if (targetFields.length === 1) {
        fieldValues[targetFields[0].fieldId] = userMessage;
      }
      // For multiple fields, return empty — caller handles retry/skip logic
      const unresolved = targetFields
        .map(f => f.fieldId)
        .filter(id => !fieldValues[id]);
      return { fieldValues, unresolved, metadata: { fallback: true, error: error.message } };
    }
  }

  /**
   * Generate section introduction message
   */
  async generateSectionIntro(
    conversationId: string,
    currentSection: TemplateSection,
    completedSections: string[],
    context: Record<string, any>,
  ): Promise<{ content: string; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'section_transition',
      requestType: 'section_intro',
      syncData: {
        currentSection: {
          sectionId: currentSection.sectionId,
          sectionNumber: currentSection.sectionNumber,
          title: currentSection.title,
          description: currentSection.description,
        },
        sectionAnswers: {},
        completedSections,
        context: {
          orgName: context.orgName || 'the organization',
          ...context,
        },
      },
    };

    return this.callPythonAPI(request);
  }

  private buildTransitionFallback(currentSection: TemplateSection, nextSection: TemplateSection | null): string {
    const completedPart = `✅ Great work — **${currentSection.title}** is complete!`;
    if (!nextSection) {
      return `${completedPart}\n\nYou've finished all sections. Your document is ready! 🎉`;
    }
    const nextPart = `Next up: **Section ${nextSection.sectionNumber}: ${nextSection.title}**${nextSection.description ? ` — ${nextSection.description}` : ''}.`;
    return `${completedPart} ${nextPart}`;
  }

  /**
   * Generate transition message between sections.
   * Passes nextSection so the LLM can introduce what's coming next.
   */
  async generateTransition(
    conversationId: string,
    currentSection: TemplateSection,
    nextSection: TemplateSection | null,
    completedSections: string[],
    context: Record<string, any>,
  ): Promise<{ content: string; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'section_transition',
      requestType: 'transition',
      syncData: {
        currentSection: {
          sectionId: currentSection.sectionId,
          sectionNumber: currentSection.sectionNumber,
          title: currentSection.title,
          description: currentSection.description,
        },
        nextSection: nextSection
          ? {
              sectionId: nextSection.sectionId,
              sectionNumber: nextSection.sectionNumber,
              title: nextSection.title,
              description: nextSection.description,
              firstField:
                nextSection.fields && nextSection.fields.length > 0
                  ? {
                      fieldId: nextSection.fields[0].fieldId,
                      label: nextSection.fields[0].label,
                      type: nextSection.fields[0].type,
                      aiQuestion: nextSection.fields[0].aiQuestion,
                      options: nextSection.fields[0].options,
                    }
                  : undefined,
            }
          : undefined,
        sectionAnswers: {},
        completedSections,
        context: {
          orgName: context.orgName || 'the organization',
          ...context,
        },
      },
    };

    try {
      const response = await this.client.post<InteractResponseDto>('/api/conversation/interact', request);
      if (!response.data.success) throw new Error('transition returned unsuccessful');
      const msg = response.data.message || '';
      // Reject generic non-contextual responses
      if (/(ready to continue|what would you like|how can I help)/i.test(msg)) {
        throw new Error('Python returned generic transition response');
      }
      return { content: msg, metadata: response.data.metadata };
    } catch (error) {
      this.logger.warn(`generateTransition using local fallback: ${error.message}`);
      return {
        content: this.buildTransitionFallback(currentSection, nextSection),
        metadata: { fallback: true },
      };
    }
  }

  /**
   * Generate completion message
   */
  async generateCompletion(
    conversationId: string,
    templateName: string,
    completedSections: string[],
    context: Record<string, any>,
  ): Promise<{ content: string; metadata?: any }> {
    const request: InteractRequestDto = {
      conversationId,
      action: 'section_transition',
      requestType: 'completion',
      syncData: {
        currentSection: {
          sectionId: 'completion',
          sectionNumber: 0,
          title: templateName,
        },
        sectionAnswers: {},
        completedSections,
        context: {
          orgName: context.orgName || 'the organization',
          templateName,
          ...context,
        },
      },
    };

    return this.callPythonAPI(request);
  }

  /**
   * Call Python AI API with retry logic
   */
  private async callPythonAPI(
    request: InteractRequestDto,
    fallbackField?: TemplateField,
  ): Promise<{ content: string; metadata?: any }> {
    try {
      this.logger.debug(`Calling Python AI API: ${request.requestType} for conversation ${request.conversationId}`);
      
      const response = await this.client.post<InteractResponseDto>(
        '/api/conversation/interact',
        request,
      );

      if (!response.data.success) {
        throw new Error('AI generation returned unsuccessful response');
      }

      this.logger.debug(`Python AI response received: ${response.data.message.substring(0, 100)}...`);

      return {
        content: response.data.message,
        metadata: response.data.metadata,
      };
    } catch (error) {
      this.logger.error(`Python AI Service call failed: ${error.message}`);
      
      // Fallback to simple question if AI service unavailable
      const fallbackContent = this.generateFallbackMessage(request.requestType, fallbackField);
      
      return {
        content: fallbackContent,
        metadata: { fallback: true, error: error.message },
      };
    }
  }

  /**
   * Generate fallback message when Python service is unavailable
   */
  private generateFallbackMessage(requestType: string, field?: TemplateField): string {
    switch (requestType) {
      case 'field_question':
        return field?.aiQuestion || field?.label || 'Please provide your answer.';
      
      case 'section_intro':
        return "Let's begin this section. I'll ask you a series of questions.";
      
      case 'transition':
        return "Great! Let's move on to the next section.";
      
      case 'completion':
        return "Excellent work! Your document has been completed.";
      
      default:
        return 'Please provide your response.';
    }
  }

  /**
   * Reset conversation state (for testing)
   */
  async resetConversation(conversationId: string): Promise<boolean> {
    try {
      await this.client.post('/api/conversation/reset', null, {
        params: { conversation_id: conversationId },
      });
      this.logger.log(`Reset conversation ${conversationId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to reset conversation: ${error.message}`);
      return false;
    }
  }
}
