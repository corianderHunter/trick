import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { PhaseStatus } from '../../entities/project-task.entity';

export class CreateProjectTaskDto {
  @ApiProperty({ description: '任务名称', example: '第一集', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: '剧本创作状态',
    enum: PhaseStatus,
    default: PhaseStatus.NOT_STARTED,
  })
  @IsOptional()
  @IsEnum(PhaseStatus)
  scriptStatus?: PhaseStatus;

  @ApiPropertyOptional({
    description: '视频创作状态',
    enum: PhaseStatus,
    default: PhaseStatus.NOT_STARTED,
  })
  @IsOptional()
  @IsEnum(PhaseStatus)
  videoStatus?: PhaseStatus;

  @ApiPropertyOptional({ description: '剧本正文（HTML）' })
  @IsOptional()
  @IsString()
  scriptBody?: string | null;

  @ApiPropertyOptional({ description: '剧本创作选择的模型 ID' })
  @IsOptional()
  @IsString()
  scriptModelId?: string | null;

  @ApiPropertyOptional({
    description: '台词量化指标（修辞密度、情绪显性度等）',
  })
  @IsOptional()
  @IsObject()
  scriptDialogueQuantify?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description:
      '为 true 时保存后触发剧本创作模型调用；为 false 或未传时仅保存数据',
  })
  @IsOptional()
  @IsBoolean()
  triggerScriptModel?: boolean;
}
