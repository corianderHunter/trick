import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

/** 剧本创作 / 视频创作 阶段状态 */
export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('project_task')
export class ProjectTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'script_status',
    type: 'varchar',
    length: 20,
    default: PhaseStatus.NOT_STARTED,
  })
  scriptStatus: PhaseStatus;

  @Column({
    name: 'video_status',
    type: 'varchar',
    length: 20,
    default: PhaseStatus.NOT_STARTED,
  })
  videoStatus: PhaseStatus;

  @Column({ name: 'script_body', type: 'text', nullable: true })
  scriptBody: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
