import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTask } from '../entities/project-task.entity';
import { Project } from '../entities/project.entity';
import { ProjectTaskService } from './project-task.service';
import { ProjectTaskController } from './project-task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTask, Project])],
  controllers: [ProjectTaskController],
  providers: [ProjectTaskService],
  exports: [ProjectTaskService],
})
export class ProjectTaskModule {}
