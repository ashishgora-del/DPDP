import { IsString, IsUUID, IsInt, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContentBlockTypeEnum {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  DOWNLOAD = 'DOWNLOAD',
  CODE_LAB = 'CODE_LAB',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
}

export class CreateContentBlockDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

  @ApiProperty({ enum: ContentBlockTypeEnum })
  @IsEnum(ContentBlockTypeEnum)
  type: ContentBlockTypeEnum;

  @ApiProperty()
  @IsInt()
  orderIndex: number;

  @ApiProperty({ 
    required: false,
    description: 'Text content for TEXT type blocks',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ 
    required: false,
    description: 'Type-specific metadata payload (e.g., video URL, duration, quiz data)',
    example: { src: 'https://video.example.com/video.mp4', duration: 1200 }
  })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ 
    required: false,
    description: 'Legacy data field (use content/metadata instead)',
  })
  @IsOptional()
  data?: any;
}
