import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationTask, TaskStatus } from '../entities/generation-task.entity';
import { ModelConfigService } from '../model-config/model-config.service';
import { PromptService } from '../prompt/prompt.service';
import { AiClientFactory } from '../ai/ai-client.factory';
import { buildPromptForVideo } from '../ai/ai-director-prompt-generator';
import type { VisualQuantifyValue } from '../ai/ai-director-prompt-generator';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationService {
  constructor(
    @InjectRepository(GenerationTask)
    private readonly generationTaskRepository: Repository<GenerationTask>,
    private readonly modelConfigService: ModelConfigService,
    private readonly promptService: PromptService,
    private readonly aiClientFactory: AiClientFactory,
  ) {}

  async create(dto: CreateGenerationDto): Promise<GenerationTask> {
    const modelConfig = await this.modelConfigService.findOne(dto.modelId);
    if (!modelConfig) throw new BadRequestException('所选模型不存在');

    const task = this.generationTaskRepository.create({
      content: dto.content,
      dialogueStyleId: null,
      visualStyleId: null,
      dialogueQuantify: dto.dialogueQuantify as Record<string, unknown>,
      visualQuantify: dto.visualQuantify as Record<string, unknown>,
      modelConfigId: dto.modelId,
      status: TaskStatus.PENDING,
      result: null,
      errorMessage: null,
    });

    const saved = await this.generationTaskRepository.save(task);

    this.processTask(saved.id).catch(() => {});

    return saved;
  }

  private async processTask(taskId: string): Promise<void> {
    await this.generationTaskRepository.update(taskId, {
      status: TaskStatus.PROCESSING,
    });

    const task = await this.generationTaskRepository.findOne({
      where: { id: taskId },
      relations: ['modelConfig'],
    });
    if (!task || !task.dialogueQuantify || !task.visualQuantify) {
      await this.generationTaskRepository.update(taskId, {
        status: TaskStatus.FAILED,
        errorMessage: '任务数据不完整',
      });
      return;
    }

    try {
      const visualTemplate =
        await this.promptService.getTemplateContent('visual');
      const prompt = buildPromptForVideo(
        task.content,
        task.visualQuantify as unknown as VisualQuantifyValue,
        visualTemplate,
      );

      const client = this.aiClientFactory.create({
        apiUrl: task.modelConfig.apiUrl,
        apiKey: task.modelConfig.apiKey,
        provider: task.modelConfig.provider,
      });

      const result = await client.generate(prompt);

      await this.generationTaskRepository.update(taskId, {
        status: TaskStatus.COMPLETED,
        result,
        errorMessage: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.generationTaskRepository.update(taskId, {
        status: TaskStatus.FAILED,
        errorMessage: message,
      });
    }
  }

  async findAll(): Promise<GenerationTask[]> {
    return this.generationTaskRepository.find({
      relations: ['modelConfig'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GenerationTask | null> {
    return this.generationTaskRepository.findOne({
      where: { id },
      relations: ['modelConfig'],
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.generationTaskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('生成记录不存在');
    }
  }
}
