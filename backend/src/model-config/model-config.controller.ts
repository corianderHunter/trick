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
import { ModelConfigService } from './model-config.service';
import { CreateModelConfigDto } from './dto/create-model-config.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';

@ApiTags('模型配置')
@Controller('api/model-configs')
export class ModelConfigController {
  constructor(private readonly modelConfigService: ModelConfigService) {}

  @Post()
  @ApiOperation({ summary: '创建模型配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@Body() dto: CreateModelConfigDto) {
    return this.modelConfigService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取模型配置列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll() {
    return this.modelConfigService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个模型配置' })
  @ApiParam({ name: 'id', description: '配置 ID（UUID）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  async findOne(@Param('id') id: string) {
    return this.modelConfigService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新模型配置' })
  @ApiParam({ name: 'id', description: '配置 ID（UUID）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateModelConfigDto) {
    return this.modelConfigService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型配置' })
  @ApiParam({ name: 'id', description: '配置 ID（UUID）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  async remove(@Param('id') id: string) {
    await this.modelConfigService.remove(id);
  }
}
