import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModuleProgressDto {
  @ApiProperty({ example: 75, description: 'Progress percentage (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent: number;

  @ApiProperty({ example: 120, description: 'Last playback position in seconds', required: false })
  @IsInt()
  @IsOptional()
  lastPosition?: number;
}
