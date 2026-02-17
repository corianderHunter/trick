import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateModelConfigDto {
  @ApiProperty({ description: '模型名称', example: 'GPT-4o' })
  @IsString()
  @MinLength(1, { message: '模型名称不能为空' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'API 地址',
    example: 'https://api.openai.com/v1',
  })
  @IsString()
  @IsUrl({}, { message: '请输入有效的 API 地址' })
  @MaxLength(500)
  apiUrl: string;

  @ApiProperty({ description: 'API 密钥', example: 'sk-xxx' })
  @IsString()
  @MinLength(1, { message: 'API 密钥不能为空' })
  @MaxLength(500)
  apiKey: string;

  @ApiPropertyOptional({
    description: '说明',
    example: '多模态大模型，综合能力强',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'AI 提供商类型',
    example: 'deepseek',
    enum: ['deepseek', 'openai', 'custom'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}
