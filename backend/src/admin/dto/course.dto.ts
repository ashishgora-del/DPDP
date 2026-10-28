import { IsString, IsUUID, IsOptional, IsInt, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { COURSE_LEVELS } from '../../common/constants/enums';

export class CreateCourseDto {
  @ApiProperty()
  @IsUUID()
  pathId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: 'Alias for title (used in some contexts)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: COURSE_LEVELS })
  @IsIn(COURSE_LEVELS)
  level: string;

  @ApiProperty()
  @IsInt()
  orderIndex: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateCourseDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  pathId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, enum: COURSE_LEVELS })
  @IsIn(COURSE_LEVELS)
  @IsOptional()
  level?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
