import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PromptService, PromptItem } from './prompt.service';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptKey } from '../entities/prompt.entity';

const VALID_KEYS: PromptKey[] = ['script', 'visual'];

function assertPromptKey(key: string): asserts key is PromptKey {
  if (!VALID_KEYS.includes(key as PromptKey)) {
    throw new BadRequestException('无效的 key，仅支持 script | visual');
  }
}

@ApiTags('Prompt 管理')
@Controller('api/prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  @ApiOperation({ summary: '获取所有 Prompt（剧本、画面）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(): Promise<PromptItem[]> {
    return this.promptService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: '按 key 获取单个 Prompt' })
  @ApiParam({ name: 'key', description: 'script | visual' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('key') key: string): Promise<PromptItem> {
    assertPromptKey(key);
    return this.promptService.findByKey(key);
  }

  @Patch(':key')
  @ApiOperation({ summary: '更新指定 Prompt 模板' })
  @ApiParam({ name: 'key', description: 'script | visual' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdatePromptDto,
  ): Promise<PromptItem> {
    assertPromptKey(key);
    return this.promptService.update(key, dto.content);
  }
}
