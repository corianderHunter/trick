import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTask, PhaseStatus } from '../entities/project-task.entity';
import { Project } from '../entities/project.entity';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { ModelConfigService } from '../model-config/model-config.service';
import { AiClientFactory } from '../ai/ai-client.factory';
import { buildPromptForScript } from '../ai/ai-director-prompt-generator';
import type { DialogueQuantifyValue } from '../ai/ai-director-prompt-generator';

/** 简单将 HTML 转为纯文本供 prompt 使用 */
function htmlToPlainText(html: string): string {
  if (!html?.trim()) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

@Injectable()
export class ProjectTaskService {
  constructor(
    @InjectRepository(ProjectTask)
    private readonly taskRepository: Repository<ProjectTask>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly modelConfigService: ModelConfigService,
    private readonly aiClientFactory: AiClientFactory,
  ) {}

  async findAllByProjectId(projectId: string): Promise<ProjectTask[]> {
    await this.assertProjectExists(projectId);
    return this.taskRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(projectId: string, taskId: string): Promise<ProjectTask> {
    await this.assertProjectExists(projectId);
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  /** 仅查询剧本创作模型调用状态（轮询用，轻量） */
  async getScriptCallStatus(
    projectId: string,
    taskId: string,
  ): Promise<{
    scriptModelCallStatus: ProjectTask['scriptModelCallStatus'];
    scriptModelResult: string | null;
    scriptModelError: string | null;
  }> {
    const task = await this.findOne(projectId, taskId);
    return {
      scriptModelCallStatus: task.scriptModelCallStatus ?? null,
      scriptModelResult: task.scriptModelResult ?? null,
      scriptModelError: task.scriptModelError ?? null,
    };
  }

  async create(
    projectId: string,
    dto: CreateProjectTaskDto,
  ): Promise<ProjectTask> {
    await this.assertProjectExists(projectId);
    const task = this.taskRepository.create({
      projectId,
      name: dto.name,
      scriptStatus: dto.scriptStatus ?? PhaseStatus.NOT_STARTED,
      videoStatus: dto.videoStatus ?? PhaseStatus.NOT_STARTED,
      scriptBody: dto.scriptBody ?? null,
    });
    return this.taskRepository.save(task);
  }

  async update(
    projectId: string,
    taskId: string,
    dto: UpdateProjectTaskDto,
  ): Promise<ProjectTask> {
    if (dto.triggerScriptModel === true) {
      if (!String(dto.scriptBody ?? '').trim()) {
        throw new BadRequestException('正文内容不能为空');
      }
      if (!String(dto.scriptModelId ?? '').trim()) {
        throw new BadRequestException('请选择模型');
      }
    }

    const task = await this.findOne(projectId, taskId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(
        ([k, v]) => v !== undefined && k !== 'triggerScriptModel',
      ),
    ) as Partial<ProjectTask>;
    Object.assign(task, updates);
    const saved = await this.taskRepository.save(task);

    if (dto.triggerScriptModel === true) {
      const body = (saved.scriptBody ?? '').trim();
      const modelId = (saved.scriptModelId ?? '').trim();
      const dialogue = saved.scriptDialogueQuantify;
      if (
        body &&
        modelId &&
        dialogue &&
        typeof dialogue === 'object' &&
        Object.keys(dialogue).length > 0
      ) {
        saved.scriptModelCallStatus = 'calling';
        saved.scriptModelError = null;
        await this.taskRepository.save(saved);
        this.triggerScriptModelCall(projectId, taskId).catch(() => {});
      }
    }

    return saved;
  }

  private async triggerScriptModelCall(
    projectId: string,
    taskId: string,
  ): Promise<void> {
    const task = await this.findOne(projectId, taskId);
    const modelConfig = await this.modelConfigService.findOne(
      task.scriptModelId!,
    );
    if (!modelConfig) {
      await this.taskRepository.update(
        { id: taskId, projectId },
        {
          scriptModelCallStatus: 'failed',
          scriptModelError: '所选模型不存在',
        },
      );
      return;
    }

    try {
      const plainText = htmlToPlainText(task.scriptBody ?? '');
      const prompt = buildPromptForScript(
        plainText,
        task.scriptDialogueQuantify as unknown as DialogueQuantifyValue,
      );
      const client = this.aiClientFactory.create({
        apiUrl: modelConfig.apiUrl,
        apiKey: modelConfig.apiKey,
        provider: modelConfig.provider,
      });
      const result = await client.generate(prompt);

      await this.taskRepository.update(
        { id: taskId, projectId },
        {
          scriptModelCallStatus: 'completed',
          scriptModelResult: result,
          scriptModelError: null,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.taskRepository.update(
        { id: taskId, projectId },
        {
          scriptModelCallStatus: 'failed',
          scriptModelError: message,
        },
      );
    }
  }

  async remove(projectId: string, taskId: string): Promise<void> {
    const result = await this.taskRepository.delete({
      id: taskId,
      projectId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('任务不存在');
    }
  }

  private async assertProjectExists(projectId: string): Promise<void> {
    const exists = await this.projectRepository.exists({
      where: { id: projectId },
    });
    if (!exists) {
      throw new NotFoundException('项目不存在');
    }
  }
}
