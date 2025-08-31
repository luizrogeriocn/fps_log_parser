import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MatchFragStreaks {
  constructor(private readonly dataSource: DataSource) {}

  async execute(matchIdentifier: string) {
    const result = await this.dataSource.query(`
      with player_kills as (
        select k.happened_at, p.name
        from kills k
        join match_participants mp on mp.id = k.killer_match_participant_id
        join players p on p.id = mp.player_id
        join matches m on m.id = mp.match_id
        where m.match_identifier = $1
      ),
      player_deaths as (
        select k.happened_at, p.name
        from kills k
        join match_participants mp on mp.id = k.victim_match_participant_id
        join players p on p.id = mp.player_id
        join matches m on m.id = mp.match_id
        where m.match_identifier = $1
      ),
      events as (
        select pk.name as player, pk.happened_at, 1 as is_kill, 0 as is_death
        from player_kills pk
        union all
        select pd.name as player, pd.happened_at , 0 as is_kill, 1 as is_death
        from player_deaths pd
      ),
      events_with_death_count as (
        select player,
          is_kill,
          sum(is_death) over (
            partition by player
            order by happened_at
            rows between unbounded preceding and current row
          ) as death_count
        from events
      ),
      player_streaks as (
        select player, count(*) filter (where is_kill = 1) as kill_streak
        from events_with_death_count
        group by player, death_count
      )
      select player, max(kill_streak) as longest_streak
      from player_streaks
      group by player
      order by longest_streak desc;
    `, [matchIdentifier]);

    return result;
  }
}
