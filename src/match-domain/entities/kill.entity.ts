import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MatchParticipant } from './match-participant.entity';

@Entity({ name: 'kills' })
export class Kill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MatchParticipant, (mp) => mp.killsAsKiller, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'killer_match_participant_id' })
  @Index()
  killer: MatchParticipant | null;

  @ManyToOne(() => MatchParticipant, (mp) => mp.killsAsVictim, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'victim_match_participant_id' })
  @Index()
  victim: MatchParticipant;

  @Column({ type: 'timestamptz', name: 'happened_at' })
  happenedAt: Date;

  @Column({ type: 'varchar', length: 120, name: 'cause_of_death' })
  causeOfDeath: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
