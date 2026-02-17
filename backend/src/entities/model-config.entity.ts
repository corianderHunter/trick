import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GenerationTask } from './generation-task.entity';

@Entity('model_config')
export class ModelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'api_url', length: 500 })
  apiUrl: string;

  @Column({ name: 'api_key', length: 500 })
  apiKey: string;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'provider', length: 50, default: 'deepseek' })
  provider: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GenerationTask, (task) => task.modelConfig)
  generationTasks: GenerationTask[];
}
