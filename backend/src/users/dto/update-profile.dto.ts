import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PRIMARY_ROLES } from '../../common/constants/enums';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, enum: PRIMARY_ROLES })
  @IsIn(PRIMARY_ROLES)
  @IsOptional()
  primaryRole?: string;
}
