import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCustomDto {
  @ApiProperty({
    description: 'Custom prompt describing the document to generate',
    example: 'Generate a DPDPA-compliant privacy notice for a healthcare mobile app that collects patient health records',
    minLength: 20,
  })
  @IsString()
  @MinLength(20, { message: 'Prompt must be at least 20 characters' })
  prompt: string;

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
}
