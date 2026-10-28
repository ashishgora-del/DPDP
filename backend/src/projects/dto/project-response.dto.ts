import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ProjectWithProgressDto extends ProjectResponseDto {
  @ApiPropertyOptional() latestAssessmentId?: string;
  @ApiPropertyOptional() riskTier?: string;
  @ApiPropertyOptional() templatesGenerated?: number;
  @ApiPropertyOptional() lastActivity?: string;
}
