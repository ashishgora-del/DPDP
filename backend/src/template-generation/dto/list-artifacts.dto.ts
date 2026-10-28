import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ArtifactCategory {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  VENDOR = 'VENDOR',
  AI_GOVERNANCE = 'AI_GOVERNANCE',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  SPECIAL_CATEGORIES = 'SPECIAL_CATEGORIES',
  CROSS_BORDER = 'CROSS_BORDER',
  RECORDS_MANAGEMENT = 'RECORDS_MANAGEMENT',
}

export class ListArtifactsDto {
  @ApiProperty({
    description: 'Filter by category',
    enum: ArtifactCategory,
    required: false,
  })
  @IsEnum(ArtifactCategory)
  @IsOptional()
  category?: ArtifactCategory;

  @ApiProperty({
    description: 'Filter by risk tier (BASIC, MODERATE, HIGH)',
    required: false,
  })
  @IsString()
  @IsOptional()
  riskTier?: string;
}
