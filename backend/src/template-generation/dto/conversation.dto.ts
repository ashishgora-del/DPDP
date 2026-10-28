import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for starting a new AI conversation
 */
export class StartConversationDto {
  @ApiProperty({
    description: 'Template ID to use for this conversation',
    example: 'vendor-risk-assessment',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiPropertyOptional({
    description: 'Optional assessment ID to provide context',
    example: '13dbf1bb-e11f-4ce0-8e99-ab5ec4044bbc',
  })
  @IsUUID()
  @IsOptional()
  assessmentId?: string;
}

/**
 * DTO for submitting an answer in a conversation (legacy single-field mode)
 */
export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Field ID being answered',
    example: 'assessment_name',
  })
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @ApiProperty({
    description: 'Answer value (can be string, number, array, etc.)',
    example: 'CRM Vendor Review',
  })
  @IsNotEmpty()
  value: any;
}

/**
 * DTO for submitting a free-text message in a conversation (grouped/conversational mode)
 */
export class SubmitMessageDto {
  @ApiProperty({
    description: 'Natural language message answering the AI question (may cover multiple fields at once)',
    example: 'Acme Corp, based in the US, their website is acme.com and the contact is John Doe at john@acme.com',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

/**
 * DTO for jumping to a specific section (edit / re-fill mode)
 */
export class JumpToSectionDto {
  @ApiProperty({
    description: 'ID of the section to jump to',
    example: 'vendor_basic_info',
  })
  @IsString()
  @IsNotEmpty()
  sectionId: string;
}

/**
 * DTO for AI response from Python service
 */
export class AIResponseDto {
  @ApiProperty()
  status: 'continue_section' | 'section_complete' | 'start_section' | 'document_complete' | 'validation_error';

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  sectionComplete: boolean;

  @ApiProperty()
  aiResponse: {
    message: string;
    messageType: 'intro' | 'question' | 'answer' | 'transition' | 'completion' | 'error';
    timestamp: string;
  };

  @ApiPropertyOptional()
  nextField?: any;

  @ApiPropertyOptional()
  progress?: {
    currentFieldIndex: number;
    totalFields: number;
    fieldsCompleted: number;
  };

  @ApiPropertyOptional()
  generatedMarkdown?: string;

  @ApiPropertyOptional()
  nextSectionId?: string;

  @ApiPropertyOptional()
  documentSummary?: any;

  @ApiPropertyOptional()
  finalMarkdown?: string;
}
