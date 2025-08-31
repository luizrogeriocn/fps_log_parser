import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MatchNoDeath {
  constructor(private readonly dataSource: DataSource) {}

  async execute(matchIdentifier: string) {
    const result = await this.dataSource.query(`
      select p.name
      from matches m
      join match_participants mp on mp.match_id = m.id
      join players p on p.id = mp.player_id
      left join kills k on k.victim_match_participant_id = mp.id
      where m.match_identifier = $1 and k.id is null
    `, [matchIdentifier]);

    return result;
  }
}
