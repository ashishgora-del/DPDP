import { IsNumber, Min, Max, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent: number;

  @ApiProperty({ required: false, description: 'Last position (e.g., video timestamp, block ID)' })
  @IsObject()
  @IsOptional()
  lastPosition?: any;
}
