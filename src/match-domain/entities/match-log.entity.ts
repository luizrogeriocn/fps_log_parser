import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Match } from './match.entity';

export enum MatchLogStatus {
  Uploaded = 'uploaded',
  Processing = 'processing',
  Processed = 'processed',
  Failed = 'failed',
}

@Entity({ name: 'match_logs' })
export class MatchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // where the file is stored
  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'enum',
    enum: MatchLogStatus,
    default: MatchLogStatus.Uploaded,
  })
  status: MatchLogStatus;

  // should only be nullable until status is either processed or failed
  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @OneToMany(() => Match, (match) => match.matchLog)
  matches: Match[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
