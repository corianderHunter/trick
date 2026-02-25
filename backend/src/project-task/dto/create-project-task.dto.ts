import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
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
}
