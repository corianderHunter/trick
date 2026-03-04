import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Material } from './material.entity';

@Entity('material_image')
export class MaterialImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @ManyToOne(() => Material, (m) => m.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  /** 文件名（上传后返回的 url），用于 GET /api/materials/files/:filePath 访问 */
  @Column({ name: 'file_path', type: 'varchar', length: 255 })
  filePath: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
