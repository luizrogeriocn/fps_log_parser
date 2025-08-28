import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatchLog } from './match-log.entity';
import { MatchParticipant } from './match-participant.entity';

@Entity({ name: 'matches' })
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', name: 'match_identifier', unique: true })
  matchIdentifier: string;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'finished_at'})
  finishedAt: Date;

  @ManyToOne(() => MatchLog, (log) => log.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_log_id' })
  matchLog: MatchLog;

  @OneToMany(() => MatchParticipant, (mp) => mp.match)
  participants: MatchParticipant[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
