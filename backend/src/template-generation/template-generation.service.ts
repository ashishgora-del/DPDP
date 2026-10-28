import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import {
  GenerateFromTemplateDto,
  GenerateCustomDto,
  UpdateDocumentDto,
  ListArtifactsDto,
} from './dto';
import { Artifact, GeneratedDocument, RiskAssessment } from '../database/database.types';

@Injectable()
export class TemplateGenerationService {
  private readonly logger = new Logger(TemplateGenerationService.name);

  constructor(
    private databaseService: DatabaseService,
  ) {}

  /**
   * List available artifacts (templates)
   */
  async listArtifacts(filters: ListArtifactsDto): Promise<Artifact[]> {
    let query = 'SELECT * FROM artifacts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.riskTier) {
      query += ` AND (applicable_risk_tiers IS NULL OR applicable_risk_tiers @> $${paramIndex})`;
      params.push(JSON.stringify([filters.riskTier]));
      paramIndex++;
    }

    query += ' ORDER BY name ASC';

    const result = await this.databaseService.query(query, params);
    return result.rows;
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(artifactId: string): Promise<Artifact> {
    const result = await this.databaseService.query(
      'SELECT * FROM artifacts WHERE id = $1',
      [artifactId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Artifact ${artifactId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Generate document from template
   */
  async generateFromTemplate(
    userId: string,
    dto: GenerateFromTemplateDto,
  ): Promise<GeneratedDocument> {
    this.logger.log(`Generating document from template ${dto.artifactId} for user ${userId}`);

    // Fetch artifact
    const artifact = await this.getArtifact(dto.artifactId);

    // Fetch assessment context if provided
    let assessmentContext: RiskAssessment | null = null;
    if (dto.assessmentId) {
      assessmentContext = await this.getAssessment(dto.assessmentId, userId);
    }

    // Get template content using prompt_template_key
    const templateContent = this.getTemplateByKey(artifact.prompt_template_key);

    // Fill template placeholders without AI
    const generatedContent = this.fillTemplate(templateContent, dto.orgName, assessmentContext);

    // Save generated document
    const documentTitle = `${artifact.name} - ${dto.orgName}`;
    const document = await this.saveGeneratedDocument(
      userId,
      documentTitle,
      generatedContent,
      artifact.id,
      dto.assessmentId,
    );

    this.logger.log(`Document generated successfully: ${document.id}`);
    return document;
  }

  /**
   * Generate custom document from prompt
   */
  async generateCustomDocument(
    userId: string,
    dto: GenerateCustomDto,
  ): Promise<GeneratedDocument> {
    this.logger.log(`Generating custom document for user ${userId}`);

    // Fetch assessment context if provided
    let assessmentContext: RiskAssessment | null = null;
    if (dto.assessmentId) {
      assessmentContext = await this.getAssessment(dto.assessmentId, userId);
    }

    // Generate content without AI — use the prompt as a document skeleton
    const generatedContent = `# ${dto.prompt}

*Document created for: ${dto.orgName}*

---

## Overview

This document was created based on your request. Please edit the content below to suit your organization's specific requirements under the Digital Personal Data Protection Act, 2023.

## Content

[Edit this section with your specific requirements]

## Implementation Notes

- Review and adapt this document before use
- Consult a data protection professional if required
- Ensure alignment with DPDPA 2023 obligations
`;

    // Save generated document
    const documentTitle = `Custom Document - ${dto.orgName}`;
    const document = await this.saveGeneratedDocument(
      userId,
      documentTitle,
      generatedContent,
      null,
      dto.assessmentId,
    );

    this.logger.log(`Custom document generated successfully: ${document.id}`);
    return document;
  }

  /**
   * Get generated document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<GeneratedDocument> {
    const result = await this.databaseService.query(
      `SELECT gd.*, a.name as artifact_name, a.category as artifact_category
       FROM generated_documents gd
       LEFT JOIN artifacts a ON gd.artifact_id = a.id
       WHERE gd.id = $1`,
      [documentId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const document = result.rows[0];

    // Check ownership
    if (document.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(
    userId: string,
    page: number = 1,
    limit: number = 20,
    assessmentId?: string,
  ): Promise<{ documents: GeneratedDocument[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    const countParams: any[] = [userId];
    let countWhere = 'WHERE user_id = $1';
    if (assessmentId) {
      countParams.push(assessmentId);
      countWhere += ` AND assessment_id = $${countParams.length}`;
    }

    // Get total count
    const countResult = await this.databaseService.query(
      `SELECT COUNT(*) FROM generated_documents ${countWhere}`,
      countParams,
    );
    const total = parseInt(countResult.rows[0].count);

    const queryParams: any[] = [userId];
    let queryWhere = 'WHERE gd.user_id = $1';
    if (assessmentId) {
      queryParams.push(assessmentId);
      queryWhere += ` AND gd.assessment_id = $${queryParams.length}`;
    }
    queryParams.push(limit, offset);

    // Get paginated documents
    const result = await this.databaseService.query(
      `SELECT gd.*, a.name as artifact_name, a.category as artifact_category
       FROM generated_documents gd
       LEFT JOIN artifacts a ON gd.artifact_id = a.id
       ${queryWhere}
       ORDER BY gd.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );

    return {
      documents: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string,
    userId: string,
    dto: UpdateDocumentDto,
  ): Promise<GeneratedDocument> {
    // Verify ownership
    await this.getDocument(documentId, userId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      params.push(dto.content);
      paramIndex++;
    }

    if (dto.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(dto.status);
      paramIndex++;
    }

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(dto.title);
      paramIndex++;
    }

    if (dto.tone !== undefined) {
      updates.push(`tone = $${paramIndex}`);
      params.push(dto.tone);
      paramIndex++;
    }

    if (dto.jurisdiction !== undefined) {
      updates.push(`jurisdiction = $${paramIndex}`);
      params.push(dto.jurisdiction);
      paramIndex++;
    }

    if (dto.sector !== undefined) {
      updates.push(`sector = $${paramIndex}`);
      params.push(dto.sector);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(documentId);

    const query = `
      UPDATE generated_documents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.databaseService.query(query, params);
    return result.rows[0];
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getDocument(documentId, userId);

    await this.databaseService.query(
      'DELETE FROM generated_documents WHERE id = $1',
      [documentId],
    );

    this.logger.log(`Document ${documentId} deleted by user ${userId}`);
  }

  /**
   * Helper: Get assessment with ownership check
   */
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

  /**
   * Helper: Fill template placeholders with org/assessment context
   */
  private fillTemplate(template: string, orgName: string, assessment?: RiskAssessment | null): string {
    let content = template;

    // Replace org name placeholder
    content = content.replace(/\{\{orgName\}\}/g, orgName);
    content = content.replace(/\[Organization Name\]/g, orgName);
    content = content.replace(/\[Your Organization\]/g, orgName);

    // Replace date placeholder
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    content = content.replace(/\[Date\]/g, today);
    content = content.replace(/\{\{date\}\}/g, today);

    // Add assessment context as a footer note if available
    if (assessment) {
      const contextNote = `

---
*Assessment Context: ${orgName} | Risk Tier: ${assessment.risk_tier} | Generated: ${today}*`;
      content += contextNote;
    }

    return content;
  }

  /**
   * Helper: Get template content by key
   * This maps prompt template keys to actual template content
   */
  private getTemplateByKey(key: string): string {
    const templates: Record<string, string> = {
      CUSTOMER_PRIVACY_NOTICE: `# Privacy Notice

## Introduction
{{orgName}} ("we", "us", or "our") respects your privacy and is committed to protecting your personal data under the Digital Personal Data Protection Act, 2023 (DPDPA).

## Data We Collect
We collect the following categories of personal data:
- [List specific data types based on business context]

## Purpose of Processing
Your data is processed for:
- [Specific legitimate purposes]

## Your Rights
Under DPDPA, you have the right to:
- Access your personal data
- Correct inaccurate data
- Request erasure of data
- Withdraw consent
- Nominate a representative

## Contact Us
Data Protection Officer: [Contact details]
Email: [Email]
Address: [Physical address]`,

      EMPLOYEE_PRIVACY_NOTICE: `# Employee Privacy Notice

## Scope
This notice applies to all employees, contractors, and job applicants of {{orgName}}.

## Employee Data Processing
We process employee data for:
- HR management and payroll
- Performance evaluation
- Compliance with legal obligations
- Benefits administration

## Data Categories
- Personal identification
- Employment history
- Financial information (for payroll)
- Performance records

## Your Rights as an Employee
You have the right to access, correct, and request deletion of your personal data subject to legal retention requirements.

## Data Retention
Employee records are retained as per applicable labor laws and company policy.`,

      VENDOR_DPA_ADDENDUM: `# Data Processing Addendum (DPA)

This Data Processing Addendum is entered into between:
- Data Fiduciary: {{orgName}}
- Data Processor: [Vendor Name]

## Definitions
As per DPDPA 2023, this addendum governs the processing of personal data on behalf of the Data Fiduciary.

## Processor Obligations
The Processor shall:
- Process data only on documented instructions
- Ensure confidentiality of processing
- Implement appropriate security measures
- Assist with data subject rights requests
- Delete or return data upon termination

## Security Measures
[List technical and organizational measures]

## Sub-Processing
Prior written consent required for sub-processors.

## Liability and Indemnification
[Terms for liability in case of breach]`,

      DPIA_AI_SYSTEM: `# Data Protection Impact Assessment (DPIA) - AI System

## System Overview
- System Name: [AI System Name]
- Organization: {{orgName}}
- Assessment Date: [Date]

## Processing Description
Nature of AI processing:
- [Describe AI functionality]
- Data inputs and outputs
- Decision-making scope

## Necessity and Proportionality
Why is this processing necessary?
- [Business justification]
- Proportionality assessment

## Risk Identification
Risks to data principals:
- Automated decision-making risks
- Bias and discrimination risks
- Security and breach risks

## Risk Mitigation
Measures to address identified risks:
- Technical safeguards
- Human oversight mechanisms
- Transparency measures

## Consultation
Stakeholders consulted:
- Data Protection Officer
- Legal team
- Technical team`,

      BREACH_RESPONSE_SOP: `# Data Breach Response Procedure

## Purpose
Standard Operating Procedure for responding to personal data breaches under DPDPA.

## Breach Definition
A breach is any unauthorized access, disclosure, alteration, or loss of personal data.

## Response Timeline
- Detection to containment: Immediate
- Assessment: Within 24 hours
- Notification to Data Protection Board: 72 hours (if required)
- Notification to affected individuals: Without undue delay

## Response Steps
1. Detect and contain the breach
2. Assess severity and impact
3. Document the incident
4. Notify appropriate parties
5. Implement remedial measures
6. Review and improve controls

## Notification Requirements
Must notify if breach likely to cause harm to data principals.

## Responsibility
Data Protection Officer: [Name]
Incident Response Team: [Members]`,

      CHILDREN_DATA_SAFEGUARDS: `# Safeguards for Children's Data

## Applicability
{{orgName}} processes data of children (under 18 years) and implements enhanced protections.

## Verifiable Consent
Consent obtained from parent/guardian through:
- [Verification method]

## Special Protections
- No behavioral monitoring
- No targeted advertising
- Enhanced security measures
- Age-appropriate privacy notices

## Data Minimization
Only essential data collected for specified purposes.

## Retention Limits
Children's data deleted when no longer necessary.

## Third-Party Sharing
Strict limitations on sharing children's data with third parties.

## Parental Rights
Parents can:
- Access child's data
- Request correction
- Request deletion
- Withdraw consent`,
    };

    return templates[key] || `# ${key}\n\nTemplate content for ${key} will be generated based on your specific requirements under DPDPA 2023.`;
  }

  /**
   * Helper: Save generated document to database
   */
  private async saveGeneratedDocument(
    userId: string,
    title: string,
    content: string,
    artifactId: string | null,
    assessmentId: string | undefined,
  ): Promise<GeneratedDocument> {
    // Check if a document already exists for this artifact + assessment combination
    if (artifactId && assessmentId) {
      const checkQuery = `
        SELECT * FROM generated_documents
        WHERE artifact_id = $1 AND assessment_id = $2
        LIMIT 1
      `;
      const existing = await this.databaseService.query(checkQuery, [
        artifactId,
        assessmentId,
      ]);
      
      if (existing.rows.length > 0) {
        this.logger.log(`Document already exists for artifact ${artifactId} + assessment ${assessmentId}, returning existing`);
        return existing.rows[0];
      }
    }

    const id = randomUUID();
    const query = `
      INSERT INTO generated_documents (id, user_id, title, content, artifact_id, assessment_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'generated')
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      id,
      userId,
      title,
      content,
      artifactId,
      assessmentId || null,
    ]);

    return result.rows[0];
  }
}
