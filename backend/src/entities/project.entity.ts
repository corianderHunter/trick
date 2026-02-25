import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ebook } from './ebook.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'ebook_id', type: 'uuid', nullable: true })
  ebookId: string | null;

  @ManyToOne(() => Ebook, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ebook_id' })
  ebook: Ebook | null;

  /** 原著名称（如电子书标题），用于展示 */
  @Column({
    name: 'original_work',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  originalWork: string | null;

  @Column({ type: 'smallint', default: 0 })
  progress: number;

  @Column({ name: 'story_overview', type: 'text', nullable: true })
  storyOverview: string | null;

  @Column({ name: 'fixed_materials', type: 'jsonb', nullable: true })
  fixedMaterials: string[] | null;

  @Column({ name: 'dialogue_quantify', type: 'jsonb', nullable: true })
  dialogueQuantify: Record<string, unknown> | null;

  @Column({ name: 'visual_quantify', type: 'jsonb', nullable: true })
  visualQuantify: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_worked_at', type: 'timestamptz', nullable: true })
  lastWorkedAt: Date | null;
}
