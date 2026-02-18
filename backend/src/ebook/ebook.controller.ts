import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
import { EbookService } from './ebook.service';

@ApiTags('电子书')
@Controller('api/ebooks')
export class EbookController {
  constructor(private readonly service: EbookService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype === 'application/epub+zip' ||
          file.originalname?.toLowerCase().endsWith('.epub');
        cb(null, !!ok);
      },
    }),
  )
  @ApiOperation({ summary: '上传 EPUB 电子书' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'EPUB 文件' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '请上传 .epub 文件' })
  async upload(
    @UploadedFile()
    file: { buffer?: Buffer; originalname?: string } | undefined,
  ) {
    if (!file?.buffer) throw new BadRequestException('请上传 .epub 文件');
    const filename = file.originalname || 'book.epub';
    const ebook = await this.service.upload(filename, file.buffer);
    return {
      id: ebook.id,
      filename: ebook.filename,
      title: ebook.title,
      author: ebook.author,
      createdAt: ebook.createdAt,
    };
  }

  @Get()
  @ApiOperation({ summary: '电子书列表' })
  @ApiResponse({ status: 200, description: '列表' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':ebookId/chapters/:chapterId/content')
  @ApiOperation({ summary: '获取指定章节正文' })
  @ApiParam({ name: 'ebookId', description: '电子书 ID' })
  @ApiParam({ name: 'chapterId', description: '章节 ID（UUID）' })
  @ApiResponse({ status: 200, description: '章节 HTML 正文' })
  @ApiResponse({ status: 404, description: '电子书或章节不存在' })
  async getChapterContent(
    @Param('ebookId') ebookId: string,
    @Param('chapterId') chapterId: string,
  ) {
    const content = await this.service.getChapterContent(ebookId, chapterId);
    return { content };
  }

  @Get(':id/chapters')
  @ApiOperation({ summary: '获取电子书目录（章节列表）' })
  @ApiParam({ name: 'id', description: '电子书 ID' })
  @ApiResponse({ status: 200, description: '章节列表' })
  @ApiResponse({ status: 404, description: '电子书不存在' })
  async getChapters(@Param('id') id: string) {
    return this.service.getChapters(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '电子书详情（不含正文）' })
  @ApiParam({ name: 'id', description: '电子书 ID' })
  @ApiResponse({ status: 200, description: '详情' })
  @ApiResponse({ status: 404, description: '不存在' })
  async findOne(@Param('id') id: string) {
    const ebook = await this.service.findOne(id);
    return {
      id: ebook.id,
      filename: ebook.filename,
      title: ebook.title,
      author: ebook.author,
      createdAt: ebook.createdAt,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除电子书' })
  @ApiParam({ name: 'id', description: '电子书 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
