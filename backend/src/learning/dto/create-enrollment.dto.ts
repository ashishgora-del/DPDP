import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ENROLLMENT_SOURCES } from '../../common/constants/enums';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({ required: false, enum: ENROLLMENT_SOURCES })
  @IsIn(ENROLLMENT_SOURCES)
  @IsOptional()
  source?: string;
}
