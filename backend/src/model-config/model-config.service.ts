/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelConfig } from '../entities/model-config.entity';
import { CreateModelConfigDto } from './dto/create-model-config.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';

@Injectable()
export class ModelConfigService {
  constructor(
    @InjectRepository(ModelConfig)
    private readonly modelConfigRepository: Repository<ModelConfig>,
  ) {}

  async create(dto: CreateModelConfigDto): Promise<ModelConfig> {
    const config = this.modelConfigRepository.create({
      ...dto,
      description: dto.description ?? null,
      provider: dto.provider ?? 'deepseek',
    });
    return this.modelConfigRepository.save(config);
  }

  async findAll(): Promise<ModelConfig[]> {
    return this.modelConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ModelConfig | null> {
    return this.modelConfigRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateModelConfigDto): Promise<ModelConfig> {
    const config = await this.findOne(id);
    if (!config) {
      throw new NotFoundException('模型配置不存在');
    }
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<ModelConfig>;
    if ('description' in updates) {
      updates.description = updates.description ?? null;
    }
    Object.assign(config, updates);
    return this.modelConfigRepository.save(config);
  }

  async remove(id: string): Promise<void> {
    const result = await this.modelConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('模型配置不存在');
    }
  }
}
