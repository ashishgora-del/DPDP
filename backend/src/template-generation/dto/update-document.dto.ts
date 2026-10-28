import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentStatus {
  GENERATED = 'generated',
  DRAFT = 'draft',
  EDITED = 'edited',
  EXPORTED = 'exported',
}

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Updated document content (Markdown format)',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Document status',
    enum: DocumentStatus,
    required: false,
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiProperty({
    description: 'Custom document title',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Document tone (simple | balanced | legalistic)',
    required: false,
  })
  @IsString()
  @IsOptional()
  tone?: string;

  @ApiProperty({
    description: 'Jurisdiction (india | eu | us | uk)',
    required: false,
  })
  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @ApiProperty({
    description: 'Sector context (general | fintech | healthcare | saas | ecommerce)',
    required: false,
  })
  @IsString()
  @IsOptional()
  sector?: string;
}
