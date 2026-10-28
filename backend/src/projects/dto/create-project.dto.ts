import { IsString, IsNotEmpty, MaxLength, IsArray, ValidateNested, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Acme Corp DPDPA 2025', description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class ArtifactSelectionItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() artifactId: string;
  @ApiProperty() @IsBoolean() selected: boolean;
}

export class SaveSelectionsDto {
  @ApiProperty({ type: [ArtifactSelectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtifactSelectionItemDto)
  selections: ArtifactSelectionItemDto[];
}

export class ChecklistItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() itemId: string;
  @ApiProperty() @IsBoolean() checked: boolean;
}

export class SaveChecklistDto {
  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}

export class UploadAttachmentDto {
  @ApiProperty({ description: 'Checklist item ID this attachment relates to' })
  @IsString()
  @IsNotEmpty()
  checklistItemId: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Base64 encoded file content' })
  @IsString()
  @IsNotEmpty()
  fileData: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  @IsNotEmpty()
  fileType: string;
}
