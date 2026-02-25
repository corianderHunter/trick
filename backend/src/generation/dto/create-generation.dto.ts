import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsObject,
} from 'class-validator';

export class CreateGenerationDto {
  @ApiProperty({
    description: '文本内容（500-8000 字符纯文本）',
    example: '这是一段示例文本',
    minLength: 500,
    maxLength: 8000,
  })
  @IsString()
  @IsNotEmpty({ message: '文本内容不能为空' })
  @MinLength(500, { message: '正文不少于 500 字' })
  @MaxLength(8000, { message: '文本内容不能超过 8000 字符' })
  content: string;

  @ApiProperty({ description: '模型配置 ID（UUID）', example: 'uuid' })
  @IsUUID('4', { message: '请选择有效的模型' })
  modelId: string;

  @ApiProperty({ description: '台词量化参数' })
  @IsObject({ message: '台词量化参数格式无效' })
  dialogueQuantify: Record<string, unknown>;

  @ApiProperty({ description: '画面量化参数' })
  @IsObject({ message: '画面量化参数格式无效' })
  visualQuantify: Record<string, unknown>;
}
