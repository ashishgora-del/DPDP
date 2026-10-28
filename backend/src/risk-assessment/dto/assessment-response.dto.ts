import { ApiProperty } from '@nestjs/swagger';

export type RiskTier = 'BASIC' | 'MODERATE' | 'HIGH';

export class TemplateChildDto {
  @ApiProperty({ example: 'VENDOR_RISK_ASSESSMENT_FRAMEWORK' })
  artifactId: string;

  @ApiProperty({ example: 'Vendor Risk Assessment Framework' })
  name: string;

  @ApiProperty({ example: 'Framework for assessing third-party vendor risks' })
  description: string;

  @ApiProperty({ example: true })
  mandatory: boolean;

  @ApiProperty({ example: true })
  focusMatched: boolean;

  @ApiProperty({ type: [String], example: ['Vendor Management', 'Third-Party Risk'] })
  matchReasons: string[];
}

export class TemplateParentGroupDto {
  @ApiProperty({ example: 'Vendor Management' })
  parentCategory: string;

  @ApiProperty({ type: [TemplateChildDto] })
  children: TemplateChildDto[];

  @ApiProperty({ example: 2 })
  mandatoryCount: number;

  @ApiProperty({ example: 2 })
  focusMatchedCount: number;
}

export class MappedTemplateChildDto {
  @ApiProperty({ example: 'DATA_PROTECTION_POLICY' })
  templateId: string;

  @ApiProperty({ example: 'Data Protection Policy' })
  templateName: string;

  @ApiProperty({ enum: ['mandatory', 'recommended'] })
  applicability: 'mandatory' | 'recommended';

  @ApiProperty({ type: [String], example: ['TIER_BASIC_MANDATORY'] })
  reasonCodes: string[];
}

export class SelectedTemplateParentDto {
  @ApiProperty({ example: 'policies' })
  parentId: string;

  @ApiProperty({ example: 'Policies' })
  parentName: string;

  @ApiProperty({ example: 'Contains templates applicable to the assessed risk tier.' })
  selectionReason: string;

  @ApiProperty({ type: [MappedTemplateChildDto] })
  children: MappedTemplateChildDto[];
}

export class TemplateMappingSummaryDto {
  @ApiProperty({ example: 16 })
  parentCount: number;

  @ApiProperty({ example: 38 })
  childCount: number;

  @ApiProperty({ example: 38 })
  mandatoryCount: number;

  @ApiProperty({ example: 0 })
  recommendedCount: number;
}

export class TemplateMappingDto {
  @ApiProperty({ example: '2026-04-03' })
  mappingVersion: string;

  @ApiProperty({ type: [SelectedTemplateParentDto] })
  selectedParents: SelectedTemplateParentDto[];

  @ApiProperty({ type: TemplateMappingSummaryDto })
  summaryCounts: TemplateMappingSummaryDto;
}

export class RiskCalculationResult {
  @ApiProperty({ enum: ['BASIC', 'MODERATE', 'HIGH'] })
  riskTier: RiskTier;

  @ApiProperty({ type: [String], example: ['Privacy Notice', 'Consent Management'] })
  focusAreas: string[];

  @ApiProperty({ example: false })
  sdfFlag: boolean;

  @ApiProperty({ type: [String], example: ['Large scale processing', 'Children data'] })
  riskDrivers: string[];

  @ApiProperty({ example: 'BASIC_STARTER_KIT', required: false })
  templatePackId?: string;

  @ApiProperty({ example: 42.5 })
  normalizedScore: number;
}

export class AssessmentResponseDto extends RiskCalculationResult {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'user-id-456' })
  userId: string;

  @ApiProperty({ example: 'TechCorp Inc' })
  orgName: string;

  @ApiProperty({ example: '2026-02-27T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-27T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ type: [TemplateParentGroupDto], required: false })
  templateGroups?: TemplateParentGroupDto[];

  @ApiProperty({ type: TemplateMappingDto, required: false })
  mapping?: TemplateMappingDto;
}
