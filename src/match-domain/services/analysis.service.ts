import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Match } from "../entities/match.entity";
import { MatchParticipant } from "../entities/match-participant.entity";
import { Kill } from "../entities/kill.entity";

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(MatchParticipant)
    private readonly participantRepo: Repository<MatchParticipant>,
    @InjectRepository(Kill)
    private readonly killRepo: Repository<Kill>,
  ) {}

  async calculateScores(matchIdentifier: string) {
    const match = await this.matchRepo.findOne({
      where: { matchIdentifier },
    });

    if (!match) {
      throw new NotFoundException(
        `Partida com externalId ${matchIdentifier} não encontrada`,
      );
    }

    const participants = await this.participantRepo.find({
      where: { match: { id: match.id } },
      relations: ["player"],
    });
    const participantIds = participants.map((p) => p.id);

    const kills = await this.killRepo.find({
      where: [
        { victim: { id: In(participantIds) } },
        { killer: { id: In(participantIds) } },
      ],
      relations: ["killer", "killer.player", "victim", "victim.player"],
    });

    const scores: Record<
      string,
      { kills: number; deaths: number; weapons: Record<string, number> }
    > = {};
    for (const p of participants) {
      scores[p.player.name] = { kills: 0, deaths: 0, weapons: {} };
    }

    for (const k of kills) {
      if (k.killer?.player) {
        const killerName = k.killer.player.name;
        scores[killerName].kills += 1;

        // Count weapon (if not <WORLD>)
        if (k.killer && k.causeOfDeath) {
          scores[killerName].weapons[k.causeOfDeath] =
            (scores[killerName].weapons[k.causeOfDeath] || 0) + 1;
        }
      }
      if (k.victim?.player) {
        scores[k.victim.player.name].deaths += 1;
      }
    }

    // check winner (most kills)
    let winner: string | null = null;
    let maxKills = -1;
    for (const [name, stats] of Object.entries(scores)) {
      if (stats.kills > maxKills) {
        maxKills = stats.kills;
        winner = name;
      }
    }

    // winners fav weapon
    let favoriteWeapon: string | null = null;
    if (winner) {
      const weaponStats = scores[winner].weapons;
      if (Object.keys(weaponStats).length > 0) {
        favoriteWeapon = Object.entries(weaponStats).sort(
          (a, b) => b[1] - a[1],
        )[0][0];
      }
    }

    return {
      matchId: match.matchIdentifier,
      startTime: match.startedAt,
      endTime: match.finishedAt,
      scores,
      winner,
      favoriteWeapon,
    };
  }

  // Leaderboard global
  async getGlobalLeaderboard() {
    const participants = await this.participantRepo.find({
      relations: ["player"],
    });

    const kills = await this.killRepo.find({
      relations: ["killer", "killer.player", "victim", "victim.player"],
    });

    const scores: Record<
      string,
      { kills: number; deaths: number; playerId: string }
    > = {};

    for (const p of participants) {
      scores[p.player.name] = { kills: 0, deaths: 0, playerId: p.player.id };
    }

    for (const k of kills) {
      if (k.killer?.player) {
        scores[k.killer.player.name].kills += 1;
      }
      if (k.victim?.player) {
        scores[k.victim.player.name].deaths += 1;
      }
    }

    const leaderboard = Object.entries(scores)
      .map(([name, stats]) => ({
        player: name,
        kills: stats.kills,
        deaths: stats.deaths,
      }))
      .sort((a, b) => b.kills - a.kills);

    return leaderboard;
  }
}
