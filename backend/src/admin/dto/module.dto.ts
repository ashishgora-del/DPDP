import { IsString, IsUUID, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsInt()
  orderIndex: number;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateModuleDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
