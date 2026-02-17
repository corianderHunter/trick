import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationTask, TaskStatus } from '../entities/generation-task.entity';
import { ModelConfigService } from '../model-config/model-config.service';
import { DialogueStyleService } from '../dialogue-style/dialogue-style.service';
import { VisualStyleService } from '../visual-style/visual-style.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationService {
  constructor(
    @InjectRepository(GenerationTask)
    private readonly generationTaskRepository: Repository<GenerationTask>,
    private readonly modelConfigService: ModelConfigService,
    private readonly dialogueStyleService: DialogueStyleService,
    private readonly visualStyleService: VisualStyleService,
  ) {}

  async create(dto: CreateGenerationDto): Promise<GenerationTask> {
    const [modelConfig, dialogueStyle, visualStyle] = await Promise.all([
      this.modelConfigService.findOne(dto.modelId),
      this.dialogueStyleService.findOne(dto.dialogueStyleId),
      this.visualStyleService.findOne(dto.visualStyleId),
    ]);

    if (!modelConfig) throw new BadRequestException('所选模型不存在');
    if (!dialogueStyle) throw new BadRequestException('所选台词风格不存在');
    if (!visualStyle) throw new BadRequestException('所选画面风格不存在');

    const task = this.generationTaskRepository.create({
      content: dto.content,
      dialogueStyleId: dto.dialogueStyleId,
      visualStyleId: dto.visualStyleId,
      modelConfigId: dto.modelId,
      status: TaskStatus.PENDING,
    });

    return this.generationTaskRepository.save(task);
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
}
