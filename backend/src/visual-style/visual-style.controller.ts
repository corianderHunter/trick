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
import { VisualStyleService } from './visual-style.service';
import { CreateVisualStyleDto } from './dto/create-visual-style.dto';
import { UpdateVisualStyleDto } from './dto/update-visual-style.dto';

@ApiTags('画面风格')
@Controller('api/visual-styles')
export class VisualStyleController {
  constructor(private readonly service: VisualStyleService) {}

  @Post()
  @ApiOperation({ summary: '创建画面风格' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@Body() dto: CreateVisualStyleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取画面风格列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个画面风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新画面风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateVisualStyleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除画面风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
