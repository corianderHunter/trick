import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualStyle } from '../entities/visual-style.entity';
import { CreateVisualStyleDto } from './dto/create-visual-style.dto';
import { UpdateVisualStyleDto } from './dto/update-visual-style.dto';

@Injectable()
export class VisualStyleService {
  constructor(
    @InjectRepository(VisualStyle)
    private readonly repo: Repository<VisualStyle>,
  ) {}

  async create(dto: CreateVisualStyleDto): Promise<VisualStyle> {
    const entity = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<VisualStyle[]> {
    return this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<VisualStyle | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateVisualStyleDto): Promise<VisualStyle> {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('画面风格不存在');
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('画面风格不存在');
  }
}
