import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DialogueStyle } from '../entities/dialogue-style.entity';
import { CreateDialogueStyleDto } from './dto/create-dialogue-style.dto';
import { UpdateDialogueStyleDto } from './dto/update-dialogue-style.dto';

@Injectable()
export class DialogueStyleService {
  constructor(
    @InjectRepository(DialogueStyle)
    private readonly repo: Repository<DialogueStyle>,
  ) {}

  async create(dto: CreateDialogueStyleDto): Promise<DialogueStyle> {
    const entity = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<DialogueStyle[]> {
    return this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DialogueStyle | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(
    id: string,
    dto: UpdateDialogueStyleDto,
  ): Promise<DialogueStyle> {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('台词风格不存在');
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('台词风格不存在');
  }
}
