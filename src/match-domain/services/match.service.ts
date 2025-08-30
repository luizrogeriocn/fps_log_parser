import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchParticipant } from '../entities/match-participant.entity';
import { Kill } from '../entities/kill.entity';
import { Player } from '../entities/player.entity';
import { ChunkExtraction } from '../ingestion/match-log-parser';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(MatchParticipant) private readonly participantRepo: Repository<MatchParticipant>,
    @InjectRepository(Kill) private readonly killRepo: Repository<Kill>,
    private readonly dataSource: DataSource,
  ) {}

  async importMatch(result: ChunkExtraction): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const matchRepo = manager.getRepository(Match);
      const playerRepo = manager.getRepository(Player);
      const mpRepo = manager.getRepository(MatchParticipant);
      const killRepo = manager.getRepository(Kill);

      // check if match already exists
      const existing = await matchRepo.findOne({
        where: { matchIdentifier: result.matchIdentifier ?? null },
      });
      if (existing) return; // skip

      // create match
      const match = await matchRepo.save(
        matchRepo.create({
          matchIdentifier: result.matchIdentifier,
          startedAt: result.startTime,
          finishedAt: result.endTime,
        }),
      );

      // bulk upsert players
      const participantNames = [...new Set(result.participants)];
      await playerRepo.upsert(
        participantNames.map((name) => ({ name })), ['name']
      );

      // bulk insert participants
      const players = await playerRepo.find({
        where: { name: In(participantNames) },
      });

      const participants = await mpRepo.save(
        players.map((player) => mpRepo.create({ match, player })),
      );

      const participantsMap = new Map<string, MatchParticipant>();
      for (const p of participants) {
        participantsMap.set(p.player.name, p);
      }

      // bulk insert kills
      const kills = result.kills
        .map((k) => {
          return {
            happenedAt: k.timestamp ?? new Date(),
            causeOfDeath: k.causeOfDeath,
            killer: k.isWorldKill ? null : participantsMap.get(k.killer),
            victim: participantsMap.get(k.victim),
          };
        })

      killRepo.save(
        kills.map((kill) => killRepo.create(kill)),
      );
    });
  }
}
