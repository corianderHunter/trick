import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectTaskService } from './project-task.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';

@ApiTags('项目任务')
@Controller('api/projects/:projectId/tasks')
export class ProjectTaskController {
  constructor(private readonly projectTaskService: ProjectTaskService) {}

  @Get()
  @ApiOperation({ summary: '获取项目下的任务列表' })
  @ApiParam({ name: 'projectId', description: '项目 ID（UUID）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async findAll(@Param('projectId') projectId: string) {
    return this.projectTaskService.findAllByProjectId(projectId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: '获取单个任务' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiParam({ name: 'taskId', description: '任务 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '项目或任务不存在' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.projectTaskService.findOne(projectId, taskId);
  }

  @Post()
  @ApiOperation({ summary: '创建任务' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectTaskDto,
  ) {
    return this.projectTaskService.create(projectId, dto);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: '更新任务' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiParam({ name: 'taskId', description: '任务 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  @ApiResponse({ status: 404, description: '项目或任务不存在' })
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskDto,
  ) {
    return this.projectTaskService.update(projectId, taskId, dto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: '删除任务' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiParam({ name: 'taskId', description: '任务 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '项目或任务不存在' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    await this.projectTaskService.remove(projectId, taskId);
  }
}
