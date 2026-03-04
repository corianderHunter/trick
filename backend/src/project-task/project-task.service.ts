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
import { PromptService } from '../prompt/prompt.service';
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

/** 单次模型调用超时（毫秒），超时后置为失败 */
const SCRIPT_CALL_TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟
/** 超过此时长仍为 calling 视为卡住，允许重置并接受新调用 */
const STUCK_CALL_THRESHOLD_MS = 10 * 60 * 1000; // 10 分钟

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

@Injectable()
export class ProjectTaskService {
  constructor(
    @InjectRepository(ProjectTask)
    private readonly taskRepository: Repository<ProjectTask>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly modelConfigService: ModelConfigService,
    private readonly promptService: PromptService,
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

  /** 仅查询剧本创作模型调用状态（轮询用，轻量）；若发现本任务 calling 超时则置为 failed 并返回 */
  async getScriptCallStatus(
    projectId: string,
    taskId: string,
  ): Promise<{
    scriptModelCallStatus: ProjectTask['scriptModelCallStatus'];
    scriptModelResult: string | null;
    scriptModelError: string | null;
  }> {
    const task = await this.findOne(projectId, taskId);
    if (
      task.scriptModelCallStatus === 'calling' &&
      task.scriptModelCallStartedAt
    ) {
      const elapsed = Date.now() - task.scriptModelCallStartedAt.getTime();
      if (elapsed >= STUCK_CALL_THRESHOLD_MS) {
        await this.taskRepository.update(
          { id: taskId, projectId },
          {
            scriptModelCallStatus: 'failed',
            scriptModelError: '调用超时或异常中断，请重试',
            scriptModelCallStartedAt: null,
          },
        );
        return {
          scriptModelCallStatus: 'failed',
          scriptModelResult: task.scriptModelResult ?? null,
          scriptModelError: '调用超时或异常中断，请重试',
        };
      }
    }
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
      // 先重置“卡住”的 calling 状态（超过阈值未结束的视为异常）
      await this.resetStuckScriptCalls(projectId);
      // 禁止并发：当前项目下已有进行中的剧本模型调用时拒绝
      const inProgress = await this.hasAnyScriptCallInProgress(projectId);
      if (inProgress) {
        throw new BadRequestException(
          '当前项目已有剧本创作模型调用进行中，请等待完成后再试',
        );
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
        const startedAt = new Date();
        saved.scriptModelCallStatus = 'calling';
        saved.scriptModelError = null;
        saved.scriptModelCallStartedAt = startedAt;
        await this.taskRepository.save(saved);
        this.triggerScriptModelCall(projectId, taskId).catch(() => {});
      }
    }

    return saved;
  }

  /** 将超过阈值仍为 calling 的任务置为 failed，避免状态永远卡在“进行中” */
  private async resetStuckScriptCalls(projectId: string): Promise<void> {
    const threshold = new Date(Date.now() - STUCK_CALL_THRESHOLD_MS);
    await this.taskRepository
      .createQueryBuilder()
      .update(ProjectTask)
      .set({
        scriptModelCallStatus: 'failed',
        scriptModelError: '调用超时或异常中断，请重试',
        scriptModelCallStartedAt: null,
      })
      .where('project_id = :projectId', { projectId })
      .andWhere('script_model_call_status = :status', { status: 'calling' })
      .andWhere(
        'script_model_call_started_at IS NOT NULL AND script_model_call_started_at <= :threshold',
        { threshold },
      )
      .execute();
  }

  /** 当前项目下是否存在进行中的剧本模型调用 */
  private async hasAnyScriptCallInProgress(
    projectId: string,
  ): Promise<boolean> {
    return this.taskRepository.exists({
      where: { projectId, scriptModelCallStatus: 'calling' },
    });
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
      // 使用设置页「剧本 Prompt」保存的内容作为生成器前缀，未配置则用默认
      const scriptTemplate =
        await this.promptService.getTemplateContent('script');
      const prompt = buildPromptForScript(
        plainText,
        task.scriptDialogueQuantify as unknown as DialogueQuantifyValue,
        scriptTemplate,
      );
      const client = this.aiClientFactory.create({
        apiUrl: modelConfig.apiUrl,
        apiKey: modelConfig.apiKey,
        provider: modelConfig.provider,
      });
      const result = await withTimeout(
        client.generate(prompt),
        SCRIPT_CALL_TIMEOUT_MS,
        '模型调用超时',
      );

      await this.taskRepository.update(
        { id: taskId, projectId },
        {
          scriptModelCallStatus: 'completed',
          scriptModelResult: result,
          scriptModelError: null,
          scriptModelCallStartedAt: null,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.taskRepository.update(
        { id: taskId, projectId },
        {
          scriptModelCallStatus: 'failed',
          scriptModelError: message,
          scriptModelCallStartedAt: null,
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
