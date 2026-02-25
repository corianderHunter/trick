import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const now = new Date();
    const project = this.projectRepository.create({
      name: dto.name,
      ebookId: dto.ebookId ?? null,
      originalWork: dto.originalWork ?? null,
      progress: dto.progress ?? 0,
      storyOverview: dto.storyOverview ?? null,
      fixedMaterials: dto.fixedMaterials ?? null,
      dialogueQuantify: dto.dialogueQuantify ?? null,
      visualQuantify: dto.visualQuantify ?? null,
      defaultScriptModelId: dto.defaultScriptModelId ?? null,
      prePrompt: dto.prePrompt ?? null,
      lastWorkedAt: now,
    });
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: { ebook: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { ebook: true },
    });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<Project>;
    (updates as { lastWorkedAt?: Date }).lastWorkedAt = new Date();
    Object.assign(project, updates);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('项目不存在');
    }
  }
}
