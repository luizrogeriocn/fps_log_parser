import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchParticipant } from '../entities/match-participant.entity';
import { Kill } from '../entities/kill.entity';
import { Player } from '../entities/player.entity';
import { ChunkExtraction } from './../ingestion/match-log-consumer';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(MatchParticipant) private readonly participantRepo: Repository<MatchParticipant>,
    @InjectRepository(Kill) private readonly killRepo: Repository<Kill>,
  ) {}

  private async findOrCreatePlayer(name: string): Promise<Player> {
    let player = await this.playerRepo.findOne({ where: { name } });
    if (!player) {
      player = this.playerRepo.create({ name });
      player = await this.playerRepo.save(player);
    }
    return player;
  }

  private async findOrCreateParticipant(player: Player, match: Match): Promise<MatchParticipant> {
    let mp = await this.participantRepo.findOne({
      where: { player: { id: player.id }, match: { id: match.id } },
    });
    if (!mp) {
      mp = this.participantRepo.create({ player, match });
      mp = await this.participantRepo.save(mp);
    }
    return mp;
  }

  async saveChunk(result: ChunkExtraction): Promise<void> {
    const existing = await this.matchRepo.findOne({
      where: { matchIdentifier: result.matchIdentifier ?? null },
    });

    if (existing) {
      // Already processed this match — skip
      return;
    }

    const match = await this.matchRepo.save(
      this.matchRepo.create({
        matchIdentifier: result.matchIdentifier,
        startedAt: result.startTime,
        finishedAt: result.endTime
      }),
    );

    // participants
    const participantsMap = new Map<string, MatchParticipant>();
    for (const name of result.participants) {
      const player = await this.findOrCreatePlayer(name);
      const mp = await this.findOrCreateParticipant(player, match);
      participantsMap.set(name, mp);
    }

    // kills
    const kills: Kill[] = [];
    for (const k of result.kills) {
      const killer = k.isWorldKill ? null : participantsMap.get(k.killer);
      const victim = participantsMap.get(k.victim);

      if (!victim) continue; // skip invalid data

      kills.push(
        this.killRepo.create({
          happenedAt: k.timestamp ?? Date(),
          causeOfDeath: k.causeOfDeath,
          killer: killer,
          victim: victim,
        }),
      );
    }

    await this.killRepo.save(kills);
  }
}
