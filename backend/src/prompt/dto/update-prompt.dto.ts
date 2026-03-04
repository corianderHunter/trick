import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePromptDto {
  @ApiProperty({ description: 'Prompt 模板内容，支持占位符', example: '' })
  @IsString()
  content: string;
}
