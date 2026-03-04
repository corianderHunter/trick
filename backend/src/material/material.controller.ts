import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  MaterialService,
  MaterialListItem,
  MaterialDetail,
} from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

@ApiTags('物料')
@Controller('api/materials')
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype?.startsWith('image/') ||
          /\.(jpe?g|png|gif|webp)$/i.test(file.originalname || '');
        cb(null, !!ok);
      },
    }),
  )
  @ApiOperation({ summary: '上传物料图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '图片文件' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      '上传成功，返回 { url: "文件名" }，创建物料时 images[].url 填此值',
  })
  @ApiResponse({ status: 400, description: '请上传图片文件' })
  async upload(
    @UploadedFile()
    file:
      | { buffer?: Buffer; mimetype?: string; originalname?: string }
      | undefined,
  ) {
    if (!file?.buffer) throw new BadRequestException('请上传图片文件');
    return this.service.uploadFile({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
  }

  @Get('files/:filename')
  @ApiOperation({ summary: '获取已上传的物料图片' })
  @ApiParam({ name: 'filename', description: '上传接口返回的 url（文件名）' })
  @ApiResponse({ status: 200, description: '图片二进制' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const buffer = await this.service.getFileBuffer(filename);
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = MIME_BY_EXT[ext] || 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.send(buffer);
  }

  @Post()
  @ApiOperation({ summary: '创建物料' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@Body() dto: CreateMaterialDto): Promise<MaterialDetail> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '物料列表（含缩略图）' })
  @ApiResponse({ status: 200, description: '列表' })
  async findAll(): Promise<MaterialListItem[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '物料详情（含全部图片及描述）' })
  @ApiParam({ name: 'id', description: '物料 ID（UUID）' })
  @ApiResponse({ status: 200, description: '详情' })
  @ApiResponse({ status: 404, description: '不存在' })
  async findOne(@Param('id') id: string): Promise<MaterialDetail> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新物料' })
  @ApiParam({ name: 'id', description: '物料 ID（UUID）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
  ): Promise<MaterialDetail> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除物料' })
  @ApiParam({ name: 'id', description: '物料 ID（UUID）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
