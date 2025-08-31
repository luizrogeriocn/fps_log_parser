import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MatchWinner {
  constructor(private readonly dataSource: DataSource) {}

  async execute(matchIdentifier: string) {
    const result = await this.dataSource.query(`
      with winner as (
        select
          mp.id as match_participant_id,
          count(*) filter (where k.killer_match_participant_id = mp.id) as kills,
          count(*) filter (where k.victim_match_participant_id = mp.id) as deaths
        from match_participants mp
        join matches m on m.id = mp.match_id
        left join kills k on mp.id in (k.killer_match_participant_id, k.victim_match_participant_id)
        where m.match_identifier = $1
        group by mp.id
        order by kills desc, deaths asc
        limit 1
      ),
      weapon_stats as (
        select
          p.name as player,
          k.cause_of_death as weapon,
          count(*) as weapon_kills,
          row_number() over (
            partition by p.name
            order by count(*) desc
          ) as weapon_rank
        from match_participants mp
        join winner on winner.match_participant_id = mp.id
        join players p on p.id = mp.player_id
        join kills k on k.killer_match_participant_id = mp.id
        join matches m on m.id = mp.match_id
        where m.match_identifier = $1
        group by p.name, k.cause_of_death
      )
      select player, weapon as favorite_weapon
      from weapon_stats
      where weapon_rank = 1;
    `, [matchIdentifier]);

    return result;
  }
}
