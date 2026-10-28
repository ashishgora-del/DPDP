import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAssessmentDto {
  @ApiProperty({ example: 'TechCorp Inc', description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiPropertyOptional({ example: 'contact@techcorp.com', description: 'Contact email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Project ID to associate this assessment with' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'B2C Technology', description: 'Organization profile' })
  @IsString()
  @IsNotEmpty()
  q1_orgProfile: string;

  @ApiProperty({ example: 'India Only', description: 'Geographic scope' })
  @IsString()
  @IsNotEmpty()
  q2_geography: string;

  @ApiProperty({ example: 'Adults and children under 18', description: 'Data principals' })
  @IsString()
  @IsNotEmpty()
  q3_dataPrincipals: string;

  @ApiProperty({ example: 'Yes', description: 'Large scale processing' })
  @IsString()
  @IsNotEmpty()
  q4_largeScale: string;

  @ApiProperty({ example: 'Email,Phone,Location', description: 'Data types collected' })
  @IsString()
  @IsNotEmpty()
  q5_dataTypes: string;

  @ApiProperty({ example: 'Service Delivery,Marketing', description: 'Processing purposes' })
  @IsString()
  @IsNotEmpty()
  q6_purposes: string;

  @ApiProperty({ example: 'Automated Decision Making', description: 'AI usage' })
  @IsString()
  @IsNotEmpty()
  q7_aiUse: string;

  @ApiProperty({ example: 'More than 10', description: 'Number of vendors' })
  @IsString()
  @IsNotEmpty()
  q8_vendors: string;

  @ApiProperty({ example: 'Yes', description: 'Cross-border transfers' })
  @IsString()
  @IsNotEmpty()
  q9_crossBorder: string;

  @ApiProperty({ example: 'More than 100,000', description: 'Data volume' })
  @IsString()
  @IsNotEmpty()
  q10_volume: string;
}
