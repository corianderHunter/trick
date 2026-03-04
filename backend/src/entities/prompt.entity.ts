import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PromptKey = 'script' | 'visual';

@Entity('prompt')
export class Prompt {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  key: PromptKey;

  @Column({ type: 'text', default: '' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
