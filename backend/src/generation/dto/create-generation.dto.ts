import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateGenerationDto {
  @ApiProperty({
    description: '文本内容（0-8000 字符）',
    example: '这是一段示例文本',
    minLength: 1,
    maxLength: 8000,
  })
  @IsString()
  @IsNotEmpty({ message: '文本内容不能为空' })
  @MinLength(1, { message: '文本内容不能为空' })
  @MaxLength(8000, { message: '文本内容不能超过 8000 字符' })
  content: string;

  @ApiProperty({ description: '台词风格 ID（UUID）' })
  @IsUUID('4', { message: '请选择有效的台词风格' })
  dialogueStyleId: string;

  @ApiProperty({ description: '画面风格 ID（UUID）' })
  @IsUUID('4', { message: '请选择有效的画面风格' })
  visualStyleId: string;

  @ApiProperty({ description: '模型配置 ID（UUID）', example: 'uuid' })
  @IsUUID('4', { message: '请选择有效的模型' })
  modelId: string;
}
