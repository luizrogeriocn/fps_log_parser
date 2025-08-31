import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MatchSpeedKillers {
  constructor(private readonly dataSource: DataSource) {}
  static readonly KILLS_THRESHOLD = 5;
  static readonly SECONDS_THRESHOLD = 60;

  async execute(matchIdentifier: string) {
    const result = await this.dataSource.query(`
      with player_kills as (
        select
          pk.name,
          k.happened_at
        from kills k
        join match_participants mpk on mpk.id = k.killer_match_participant_id
        join players pk on pk.id = mpk.player_id
        join matches m on m.id = mpk.match_id
        where m.match_identifier = $1
      ),
      speed_streaks as (
        select name,
          count(*) over (
            partition by name
            order by happened_at
            range between interval '0 seconds' preceding and interval '${MatchSpeedKillers.SECONDS_THRESHOLD} seconds' following
          )
        from player_kills
      )
      select name
      from speed_streaks
      group by name
      having max(count) >= ${MatchSpeedKillers.KILLS_THRESHOLD}
    `, [matchIdentifier]);

    return result;
  }
}
