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
import { DialogueStyleService } from './dialogue-style.service';
import { CreateDialogueStyleDto } from './dto/create-dialogue-style.dto';
import { UpdateDialogueStyleDto } from './dto/update-dialogue-style.dto';

@ApiTags('台词风格')
@Controller('api/dialogue-styles')
export class DialogueStyleController {
  constructor(private readonly service: DialogueStyleService) {}

  @Post()
  @ApiOperation({ summary: '创建台词风格' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@Body() dto: CreateDialogueStyleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取台词风格列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个台词风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新台词风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateDialogueStyleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除台词风格' })
  @ApiParam({ name: 'id', description: 'ID（UUID）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
