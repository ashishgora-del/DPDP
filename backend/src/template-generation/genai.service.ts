import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';

@Injectable()
export class GenAIService {
  private readonly logger = new Logger(GenAIService.name);
  private client: AzureOpenAI;
  private deploymentName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
    this.deploymentName = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME') || 'gpt-4';

    if (!apiKey || !endpoint) {
      this.logger.warn('Azure OpenAI credentials not configured. AI generation will be disabled.');
      return;
    }

    this.client = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion: '2024-02-15-preview',
    });

    this.logger.log('GenAI Service initialized with Azure OpenAI');
  }

  /**
   * Generate document from template with context
   */
  async generateFromTemplate(
    templateContent: string,
    templateName: string,
    orgName: string,
    assessmentContext?: any,
    additionalContext?: Record<string, any>,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Azure OpenAI is not configured');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildTemplatePrompt(
      templateContent,
      templateName,
      orgName,
      assessmentContext,
      additionalContext,
    );

    this.logger.debug(`Generating document from template: ${templateName}`);

    try {
      const response = await this.client.chat.completions.create({
        model: this.deploymentName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from AI');
      }

      this.logger.debug(`Successfully generated document (${content.length} chars)`);
      return content;
    } catch (error) {
      this.logger.error('Error generating from template:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Generate custom document from user prompt
   */
  async generateCustomDocument(
    prompt: string,
    orgName: string,
    assessmentContext?: any,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Azure OpenAI is not configured');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildCustomPrompt(prompt, orgName, assessmentContext);

    this.logger.debug('Generating custom document from prompt');

    try {
      const response = await this.client.chat.completions.create({
        model: this.deploymentName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from AI');
      }

      this.logger.debug(`Successfully generated custom document (${content.length} chars)`);
      return content;
    } catch (error) {
      this.logger.error('Error generating custom document:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt for DPDPA compliance
   */
  private buildSystemPrompt(): string {
    return `You are an expert legal document generator specializing in India's Digital Personal Data Protection Act (DPDPA) 2023.

Your role:
- Generate clear, professional, legally sound documents
- Ensure DPDPA compliance in all outputs
- Use plain language accessible to non-lawyers
- Include all mandatory clauses and disclosures
- Format in clean Markdown with proper headings
- Be specific and actionable

Guidelines:
- Reference DPDPA 2023 sections where applicable
- Include both rights and obligations
- Provide practical implementation guidance
- Use Indian legal terminology correctly
- Ensure consistency with DPDPA principles

Output format:
- Use Markdown formatting
- Include clear section headings
- Use bullet points for lists
- Bold important terms
- Keep paragraphs concise`;
  }

  /**
   * Build prompt for template-based generation
   */
  private buildTemplatePrompt(
    templateContent: string,
    templateName: string,
    orgName: string,
    assessmentContext?: any,
    additionalContext?: Record<string, any>,
  ): string {
    let prompt = `Generate a customized "${templateName}" document for "${orgName}" based on the following template:\n\n`;
    prompt += `TEMPLATE:\n${templateContent}\n\n`;
    prompt += `ORGANIZATION: ${orgName}\n\n`;

    if (assessmentContext) {
      prompt += `RISK ASSESSMENT CONTEXT:\n`;
      prompt += `- Risk Tier: ${assessmentContext.riskTier}\n`;
      prompt += `- SDF Flag: ${assessmentContext.sdfFlag ? 'Yes (Significant Data Fiduciary)' : 'No'}\n`;
      
      if (assessmentContext.focusAreas?.length > 0) {
        prompt += `- Focus Areas: ${assessmentContext.focusAreas.join(', ')}\n`;
      }
      
      if (assessmentContext.riskDrivers?.length > 0) {
        prompt += `- Risk Drivers: ${assessmentContext.riskDrivers.join(', ')}\n`;
      }
      prompt += '\n';
    }

    if (additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${JSON.stringify(additionalContext, null, 2)}\n\n`;
    }

    prompt += `INSTRUCTIONS:
1. Customize the template for ${orgName}
2. Incorporate the risk assessment context appropriately
3. Ensure all placeholders are replaced with specific content
4. Make the document ready for immediate use
5. Maintain legal accuracy and DPDPA compliance
6. Output in clean Markdown format

Generate the complete document now:`;

    return prompt;
  }

  /**
   * Build prompt for custom document generation
   */
  private buildCustomPrompt(
    userPrompt: string,
    orgName: string,
    assessmentContext?: any,
  ): string {
    let prompt = `Generate a DPDPA-compliant document for "${orgName}" based on this request:\n\n`;
    prompt += `REQUEST: ${userPrompt}\n\n`;
    prompt += `ORGANIZATION: ${orgName}\n\n`;

    if (assessmentContext) {
      prompt += `RISK ASSESSMENT CONTEXT:\n`;
      prompt += `- Risk Tier: ${assessmentContext.riskTier}\n`;
      prompt += `- SDF Flag: ${assessmentContext.sdfFlag ? 'Yes (Significant Data Fiduciary)' : 'No'}\n`;
      
      if (assessmentContext.focusAreas?.length > 0) {
        prompt += `- Focus Areas: ${assessmentContext.focusAreas.join(', ')}\n`;
      }
      
      if (assessmentContext.riskDrivers?.length > 0) {
        prompt += `- Risk Drivers: ${assessmentContext.riskDrivers.join(', ')}\n`;
      }
      prompt += '\n';
    }

    prompt += `INSTRUCTIONS:
1. Create a complete, professional document addressing the request
2. Tailor content to ${orgName}'s risk profile
3. Include all necessary DPDPA clauses
4. Make it practical and actionable
5. Use proper legal structure and formatting
6. Output in clean Markdown format

Generate the document now:`;

    return prompt;
  }
}
