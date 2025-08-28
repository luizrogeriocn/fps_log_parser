import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Column,
  OneToMany,
} from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';
import { Kill } from './kill.entity';

@Entity({ name: 'match_participants' })
//@Unique('UQ_match_players_match_participant', ['match', 'player'])
export class MatchParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, (m) => m.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Player, (p) => p.matchParticipants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @OneToMany(() => Kill, (k) => k.killer)
  killsAsKiller: Kill[];

  @OneToMany(() => Kill, (k) => k.victim)
  killsAsVictim: Kill[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
