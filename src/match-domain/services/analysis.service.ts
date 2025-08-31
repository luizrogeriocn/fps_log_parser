import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class AnalysisService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async calculateScores(matchIdentifier: string) {
    // check sanitization
    const sql = `
      WITH player_stats AS (
        SELECT
          p.name AS player,
          COUNT(*) FILTER (WHERE k.killer_match_participant_id = mp.id) AS kills,
          COUNT(*) FILTER (WHERE k.victim_match_participant_id = mp.id) AS deaths
        FROM match_participants mp
        JOIN players p ON p.id = mp.player_id
        JOIN matches m ON m.id = mp.match_id
        LEFT JOIN kills k ON mp.id in (k.killer_match_participant_id, k.victim_match_participant_id)
        WHERE m.match_identifier = '${matchIdentifier}'
        GROUP BY p.name
      ),
      weapon_stats AS (
        SELECT
          p.name AS player,
          k.cause_of_death AS weapon,
          COUNT(*) AS weapon_kills,
          ROW_NUMBER() OVER (
            PARTITION BY p.name
            ORDER BY COUNT(*) DESC
          ) AS weapon_rank
        FROM match_participants mp
        JOIN players p ON p.id = mp.player_id
        JOIN kills k ON k.killer_match_participant_id = mp.id
        JOIN matches m ON m.id = mp.match_id
        WHERE m.match_identifier = '${matchIdentifier}'
        GROUP BY p.name, k.cause_of_death
      )
      SELECT
        ps.player,
        ps.kills,
        ps.deaths,
        ws.weapon AS favorite_weapon,
        ps.deaths = 0 AS no_death_award
      FROM player_stats ps
      LEFT JOIN weapon_stats ws
        ON ws.player = ps.player AND ws.weapon_rank = 1
      ORDER BY ps.kills DESC, ps.deaths ASC;
    `;

    return this.dataSource.query(sql);
  }

  async getGlobalLeaderboard() {
    const sql = `
      WITH player_stats AS (
        SELECT
          p.name AS player,
          COUNT(*) FILTER (WHERE k.killer_match_participant_id = mp.id) AS kills,
          COUNT(*) FILTER (WHERE k.victim_match_participant_id = mp.id) AS deaths
        FROM match_participants mp
        JOIN players p ON p.id = mp.player_id
        LEFT JOIN kills k ON mp.id in (k.killer_match_participant_id, k.victim_match_participant_id)
        GROUP BY p.name
      ),
      weapon_stats AS (
        SELECT
          p.name AS player,
          k.cause_of_death AS weapon,
          COUNT(*) AS weapon_kills,
          ROW_NUMBER() OVER (
            PARTITION BY p.name
            ORDER BY COUNT(*) DESC
          ) AS weapon_rank
        FROM match_participants mp
        JOIN players p ON p.id = mp.player_id
        JOIN kills k ON k.killer_match_participant_id = mp.id
        GROUP BY p.name, k.cause_of_death
      )
      SELECT
        ps.player,
        ps.kills,
        ps.deaths,
        ws.weapon AS favorite_weapon
      FROM player_stats ps
      LEFT JOIN weapon_stats ws
        ON ws.player = ps.player AND ws.weapon_rank = 1
      ORDER BY ps.kills DESC;
    `;

    return this.dataSource.query(sql);
  }

  async speedStreak(matchIdentifier: string) {
    const sql = `
      WITH player_kills AS (
        SELECT
          pk.name AS player,
          k.happened_at
        FROM kills k
        JOIN match_participants mpk ON mpk.id = k.killer_match_participant_id
        JOIN players pk ON pk.id = mpk.player_id
        JOIN matches m ON m.id = mpk.match_id
        WHERE m.match_identifier = '${matchIdentifier}'
      ),
      speed_streaks as (
        SELECT player,
          COUNT(*) OVER (
            PARTITION BY player
            ORDER BY happened_at
            RANGE BETWEEN INTERVAL '0 seconds' PRECEDING AND INTERVAL '60 seconds' FOLLOWING
          )
        FROM player_kills
      )
      select player
      from speed_streaks
      group by player
      having max(count) >= 5 -- use a constant in the class with an explicit name
    `

    return this.dataSource.query(sql);
  }

  async longestStreaks(matchIdentifier: string) {
    const sql = `
      WITH player_kills AS (
        select k.happened_at, p.name
        FROM kills k
        JOIN match_participants mp ON mp.id = k.killer_match_participant_id
        JOIN players p ON p.id = mp.player_id
        JOIN matches m ON m.id = mp.match_id
        WHERE m.match_identifier = '${matchIdentifier}'
      ),
      events AS (
        select pk.name AS player, pk.happened_at, 1 AS is_kill, 0 AS is_death
        FROM player_kills pk
        UNION ALL
        select p.name AS player, k.happened_at , 0 AS is_kill, 1 AS is_death
        FROM kills k
        JOIN match_participants mp ON mp.id = k.victim_match_participant_id
        JOIN players p ON p.id = mp.player_id
        JOIN matches m ON m.id = mp.match_id
        WHERE m.match_identifier = '${matchIdentifier}'
      ),
      sequenced AS (
        select player,
          happened_at,
          is_kill,
          is_death,
          SUM(is_death) over (partition by player order by happened_at rows between unbounded preceding and current  row) as death_count
        FROM events
      ),
      streaks as (
        select player, death_count, COUNT(*) filter (where is_kill = 1) as streak_kills
        from sequenced
        group by player, death_count
      )
      select player, max(streak_kills) AS longest_streak
      from streaks
      group by player
      order by longest_streak desc;
    `

    return this.dataSource.query(sql);
  }

  async noDeath(matchIdentifier: string) {
    const sql = `
      select p.name, k.id
      from matches m
      join match_participants mp on mp.match_id = m.id
      join players p on p.id = mp.player_id
      left join kills k on k.victim_match_participant_id = mp.id
      where m.match_identifier = '${matchIdentifier}' and k.id is null
    `

    return this.dataSource.query(sql);
  }
}
