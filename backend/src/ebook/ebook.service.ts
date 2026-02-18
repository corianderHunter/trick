import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import EPub = require('epub');
import { Ebook } from '../entities/ebook.entity';
import { EbookChapter } from '../entities/ebook-chapter.entity';

@Injectable()
export class EbookService {
  constructor(
    @InjectRepository(Ebook)
    private readonly ebookRepo: Repository<Ebook>,
    @InjectRepository(EbookChapter)
    private readonly chapterRepo: Repository<EbookChapter>,
  ) {}

  /**
   * 将 buffer 写入临时文件并解析，返回元数据与章节列表（flow）
   */
  private parseEpubBuffer(buffer: Buffer): Promise<{
    title: string | null;
    author: string | null;
    flow: Array<{ id: string; title: string | null }>;
  }> {
    return new Promise((resolve, reject) => {
      const tmpDir = require('os').tmpdir();
      const tmpPath = join(tmpDir, `epub-${randomUUID()}.epub`);
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        unlink(tmpPath).catch(() => {});
      };

      writeFile(tmpPath, buffer)
        .then(() => {
          const epub = new EPub(tmpPath);
          epub.on('end', () => {
            const metadata = epub.metadata as {
              title?: string;
              creator?: string;
            };
            const title = metadata?.title ?? null;
            const author = metadata?.creator ?? null;
            const flow = (epub.flow || []).map(
              (ch: { id: string; title?: string }) => ({
                id: ch.id,
                title: ch.title ?? null,
              }),
            );
            cleanup();
            resolve({ title, author, flow });
          });
          epub.on('error', (err: Error) => {
            cleanup();
            reject(err);
          });
          epub.parse();
        })
        .catch(reject);
    });
  }

  /**
   * 从 buffer 解析并返回指定章节正文（用于按需取章节内容）
   */
  private getChapterContentFromBuffer(
    buffer: Buffer,
    epubChapterId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tmpDir = require('os').tmpdir();
      const tmpPath = join(tmpDir, `epub-${randomUUID()}.epub`);
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        unlink(tmpPath).catch(() => {});
      };

      writeFile(tmpPath, buffer)
        .then(() => {
          const epub = new EPub(tmpPath);
          epub.on('end', () => {
            epub.getChapter(
              epubChapterId,
              (err: Error | null, text: string) => {
                cleanup();
                if (err) return reject(err);
                resolve(text ?? '');
              },
            );
          });
          epub.on('error', (err: Error) => {
            cleanup();
            reject(err);
          });
          epub.parse();
        })
        .catch(reject);
    });
  }

  async upload(filename: string, fileContent: Buffer): Promise<Ebook> {
    const { title, author, flow } = await this.parseEpubBuffer(fileContent);

    const ebook = this.ebookRepo.create({
      filename,
      fileContent,
      title,
      author,
    });
    const saved = await this.ebookRepo.save(ebook);

    const chapters = flow.map((ch, index) =>
      this.chapterRepo.create({
        ebookId: saved.id,
        chapterIndex: index,
        epubChapterId: ch.id,
        title: ch.title ?? null,
      }),
    );
    await this.chapterRepo.save(chapters);

    return saved;
  }

  async findAll(): Promise<Ebook[]> {
    return this.ebookRepo.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'filename', 'title', 'author', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<Ebook> {
    const ebook = await this.ebookRepo.findOne({ where: { id } });
    if (!ebook) throw new NotFoundException('电子书不存在');
    return ebook;
  }

  async getChapters(ebookId: string): Promise<EbookChapter[]> {
    await this.findOne(ebookId);
    return this.chapterRepo.find({
      where: { ebookId },
      order: { chapterIndex: 'ASC' },
      select: ['id', 'ebookId', 'chapterIndex', 'title'],
    });
  }

  async getChapterContent(ebookId: string, chapterId: string): Promise<string> {
    const ebook = await this.ebookRepo.findOne({ where: { id: ebookId } });
    if (!ebook) throw new NotFoundException('电子书不存在');

    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId, ebookId },
    });
    if (!chapter) throw new NotFoundException('章节不存在');

    return this.getChapterContentFromBuffer(
      ebook.fileContent,
      chapter.epubChapterId,
    );
  }

  async remove(id: string): Promise<void> {
    const result = await this.ebookRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('电子书不存在');
  }
}
