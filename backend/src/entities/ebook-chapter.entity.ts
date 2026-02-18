import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ebook } from './ebook.entity';

@Entity('ebook_chapter')
export class EbookChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ebook_id' })
  ebookId: string;

  @ManyToOne(() => Ebook, (e) => e.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ebook_id' })
  ebook: Ebook;

  /** 阅读顺序，从 0 开始 */
  @Column({ name: 'chapter_index', type: 'int' })
  chapterIndex: number;

  /** epub 内部章节 id，用于 getChapter(epubChapterId) */
  @Column({ name: 'epub_chapter_id', type: 'varchar', length: 255 })
  epubChapterId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string | null;
}
