import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MatchLeaderboard {
  constructor(private readonly dataSource: DataSource) {}

  async execute(matchIdentifier: string) {
    const result = await this.dataSource.query(`
      with player_stats as (
        select
          p.name as player,
          count(*) filter (where k.killer_match_participant_id = mp.id) as kills,
          count(*) filter (where k.victim_match_participant_id = mp.id) as deaths
        from match_participants mp
        join players p on p.id = mp.player_id
        join matches m on m.id = mp.match_id
        left join kills k on mp.id in (k.killer_match_participant_id, k.victim_match_participant_id)
        where m.match_identifier = $1
        group by p.name
      )
      select
        ps.player,
        ps.kills,
        ps.deaths
      from player_stats ps
      order by ps.kills desc, ps.deaths asc;
    `, [matchIdentifier]);

    return result;
  }
}
