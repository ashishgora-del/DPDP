import { IsUUID, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateFromTemplateDto {
  @ApiProperty({
    description: 'Artifact ID to use as template',
    example: 'art_001',
  })
  @IsString()
  artifactId: string;

  @ApiProperty({
    description: 'Optional assessment ID to provide context',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assessmentId?: string;

  @ApiProperty({
    description: 'Organization name for document customization',
    example: 'Acme Corporation',
  })
  @IsString()
  orgName: string;

  @ApiProperty({
    description: 'Optional additional context for generation',
    example: { industry: 'Healthcare', country: 'India' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
