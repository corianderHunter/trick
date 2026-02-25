import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: '我的项目', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: '电子书 ID（UUID）' })
  @IsOptional()
  @IsUUID('4')
  ebookId?: string | null;

  @ApiPropertyOptional({ description: '原著名称（展示用）', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalWork?: string | null;

  @ApiPropertyOptional({
    description: '进度 0–100',
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ description: '故事概览' })
  @IsOptional()
  @IsString()
  storyOverview?: string | null;

  @ApiPropertyOptional({ description: '固定物料名称列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fixedMaterials?: string[];

  @ApiPropertyOptional({ description: '台词量化参数' })
  @IsOptional()
  @IsObject()
  dialogueQuantify?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '画面量化参数' })
  @IsOptional()
  @IsObject()
  visualQuantify?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '默认剧本创作模型 ID（UUID）' })
  @IsOptional()
  @IsUUID('4')
  defaultScriptModelId?: string | null;

  @ApiPropertyOptional({ description: '前置 prompt' })
  @IsOptional()
  @IsString()
  prePrompt?: string | null;
}
