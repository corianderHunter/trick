import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@ApiTags('文本生成')
@Controller('api/generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post()
  @ApiOperation({ summary: '提交文本生成任务' })
  @ApiResponse({ status: 201, description: '任务创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败或模型不存在' })
  async create(@Body() dto: CreateGenerationDto) {
    return this.generationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取生成任务列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll() {
    return this.generationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个生成任务' })
  @ApiParam({ name: 'id', description: '任务 ID（UUID）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async findOne(@Param('id') id: string) {
    return this.generationService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除生成记录' })
  @ApiParam({ name: 'id', description: '任务 ID（UUID）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async remove(@Param('id') id: string) {
    await this.generationService.remove(id);
  }
}
