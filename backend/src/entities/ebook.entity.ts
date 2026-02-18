import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { EbookChapter } from './ebook-chapter.entity';

@Entity('ebook')
export class Ebook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'filename', type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'file_content', type: 'bytea' })
  fileContent: Buffer;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => EbookChapter, (ch) => ch.ebook)
  chapters: EbookChapter[];
}
