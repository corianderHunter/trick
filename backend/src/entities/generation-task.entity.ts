import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ModelConfig } from './model-config.entity';

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('generation_task')
export class GenerationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'dialogue_style_id', type: 'uuid', nullable: true })
  dialogueStyleId: string | null;

  @Column({ name: 'visual_style_id', type: 'uuid', nullable: true })
  visualStyleId: string | null;

  @Column({ name: 'dialogue_quantify', type: 'jsonb', nullable: true })
  dialogueQuantify: Record<string, unknown> | null;

  @Column({ name: 'visual_quantify', type: 'jsonb', nullable: true })
  visualQuantify: Record<string, unknown> | null;

  @Column({ name: 'model_config_id' })
  modelConfigId: string;

  @ManyToOne(() => ModelConfig, (config) => config.generationTasks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'model_config_id' })
  modelConfig: ModelConfig;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
