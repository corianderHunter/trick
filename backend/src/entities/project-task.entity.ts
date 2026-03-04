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

  @Column({
    name: 'script_model_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  scriptModelId: string | null;

  @Column({
    name: 'script_dialogue_quantify',
    type: 'simple-json',
    nullable: true,
  })
  scriptDialogueQuantify: Record<string, unknown> | null;

  /** 剧本创作模型调用状态：未调用 / 调用中 / 已完成 / 失败 */
  @Column({
    name: 'script_model_call_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'not_called',
  })
  scriptModelCallStatus:
    | 'not_called'
    | 'calling'
    | 'completed'
    | 'failed'
    | null;

  /** 模型返回结果（存档） */
  @Column({
    name: 'script_model_result',
    type: 'text',
    nullable: true,
  })
  scriptModelResult: string | null;

  /** 模型调用失败时的错误信息 */
  @Column({
    name: 'script_model_error',
    type: 'text',
    nullable: true,
  })
  scriptModelError: string | null;

  /** 剧本模型调用开始时间（用于超时/卡住恢复） */
  @Column({
    name: 'script_model_call_started_at',
    type: 'timestamp',
    nullable: true,
  })
  scriptModelCallStartedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
