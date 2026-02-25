import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTask, PhaseStatus } from '../entities/project-task.entity';
import { Project } from '../entities/project.entity';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';

@Injectable()
export class ProjectTaskService {
  constructor(
    @InjectRepository(ProjectTask)
    private readonly taskRepository: Repository<ProjectTask>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
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
    const task = await this.findOne(projectId, taskId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<ProjectTask>;
    Object.assign(task, updates);
    return this.taskRepository.save(task);
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
