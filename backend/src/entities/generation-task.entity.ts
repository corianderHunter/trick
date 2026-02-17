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

  @Column({ name: 'dialogue_style_id' })
  dialogueStyleId: string;

  @Column({ name: 'visual_style_id' })
  visualStyleId: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
