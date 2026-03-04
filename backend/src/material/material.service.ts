import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Material } from '../entities/material.entity';
import { MaterialImage } from '../entities/material-image.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

const UPLOAD_DIR = 'uploads/materials';
const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export type MaterialListItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnails: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MaterialDetail = {
  id: string;
  title: string;
  description: string | null;
  images: Array<{ url: string; description: string | null }>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(MaterialImage)
    private readonly imageRepo: Repository<MaterialImage>,
  ) {}

  private getUploadDir(): string {
    return join(process.cwd(), UPLOAD_DIR);
  }

  private getFilePath(filename: string): string {
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('无效的文件名');
    }
    return join(this.getUploadDir(), filename);
  }

  /** 上传图片：保存到磁盘，返回文件名（前端用此作为 url 参与创建物料） */
  async uploadFile(file: {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
  }): Promise<{ url: string }> {
    const ext =
      ALLOWED_MIMES[file.mimetype || ''] ||
      file.originalname
        ?.match(/\.(jpe?g|png|gif|webp)$/i)?.[1]
        ?.toLowerCase() ||
      'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const dir = this.getUploadDir();
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, filename);
    await writeFile(filePath, file.buffer);
    return { url: filename };
  }

  /** 读取已上传文件内容（用于 GET /files/:filename） */
  async getFileBuffer(filename: string): Promise<Buffer> {
    const filePath = this.getFilePath(filename);
    try {
      return await readFile(filePath);
    } catch {
      throw new NotFoundException('文件不存在');
    }
  }

  /** 将 filename 转为前端可访问的 URL 路径（不含域名） */
  toFileUrl(filename: string): string {
    return `/api/materials/files/${filename}`;
  }

  async create(dto: CreateMaterialDto): Promise<MaterialDetail> {
    const material = this.materialRepo.create({
      title: (dto.title ?? '').trim() || '未命名物料',
      description: (dto.description ?? '').trim() || null,
    });
    const saved = await this.materialRepo.save(material);
    const items = (dto.images ?? []).filter((i) => i?.url?.trim());
    if (items.length > 0) {
      const images = items.map((item, index) =>
        this.imageRepo.create({
          materialId: saved.id,
          filePath: item.url.trim(),
          description: (item.description ?? '').trim() || null,
          sortOrder: index,
        }),
      );
      await this.imageRepo.save(images);
    }
    return this.toDetail(await this.findOneEntity(saved.id));
  }

  private async findOneEntity(id: string): Promise<Material> {
    const material = await this.materialRepo.findOne({
      where: { id },
      relations: { images: true },
      order: { images: { sortOrder: 'ASC' } },
    });
    if (!material) throw new NotFoundException('物料不存在');
    return material;
  }

  async findAll(): Promise<MaterialListItem[]> {
    const list = await this.materialRepo.find({
      relations: { images: true },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
        images: { sortOrder: 'ASC' },
      },
    });
    return list.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      thumbnails: m.images
        .slice(0, 3)
        .map((img) => this.toFileUrl(img.filePath)),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async findOne(id: string): Promise<MaterialDetail> {
    const material = await this.findOneEntity(id);
    return this.toDetail(material);
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<MaterialDetail> {
    const material = await this.findOneEntity(id);
    if (dto.title !== undefined)
      material.title = (dto.title ?? '').trim() || '未命名物料';
    if (dto.description !== undefined)
      material.description = (dto.description ?? '').trim() || null;
    await this.materialRepo.save(material);
    if (dto.images !== undefined) {
      await this.imageRepo.delete({ materialId: id });
      const items = dto.images.filter((i) => i?.url?.trim());
      if (items.length > 0) {
        const images = items.map((item, index) =>
          this.imageRepo.create({
            materialId: id,
            filePath: item.url.trim(),
            description: (item.description ?? '').trim() || null,
            sortOrder: index,
          }),
        );
        await this.imageRepo.save(images);
      }
    }
    return this.toDetail(await this.findOneEntity(id));
  }

  private toDetail(m: Material): MaterialDetail {
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      images: (m.images ?? []).map((img) => ({
        url: this.toFileUrl(img.filePath),
        description: img.description,
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOneEntity(id);
    const result = await this.materialRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('物料不存在');
    // 可选：删除磁盘上的图片文件（此处仅删库，不删文件，避免误删被引用的文件）
    for (const img of material.images ?? []) {
      const path = this.getFilePath(img.filePath);
      unlink(path).catch(() => {});
    }
  }
}
