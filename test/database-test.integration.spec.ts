import { AppDataSource } from '../src/data-source';
import { GameLogParser } from "../src/match-domain/ingestion/game-log-parser";
import { MatchLogParser } from "../src/match-domain/ingestion/match-log-parser";
import { MatchService } from "../src/match-domain/services/match.service";
import { Match } from "../src/match-domain/entities/match.entity"
import { Player } from "../src/match-domain/entities/player.entity"
import { MatchParticipant } from "../src/match-domain/entities/match-participant.entity"
import { Kill } from "../src/match-domain/entities/kill.entity"
import * as path from "path";

describe('think of a good description', () => {
  let matchService: MatchService;

  beforeAll(async () => {
    matchService = new MatchService(
      AppDataSource.getRepository(Match),
      AppDataSource.getRepository(Player),
      AppDataSource.getRepository(MatchParticipant),
      AppDataSource.getRepository(Kill),
      AppDataSource
    );
  });

  it("imports the game log from the challenge description", async () => {
    // arrange
    const logFile = path.join(__dirname, "fixtures", "sample-match.log");

    const matchLogParser = new MatchLogParser((result) =>
      matchService.importMatch(result),
    );

    const gameLogParser = new GameLogParser({
      filePath: logFile,
      onChunk: (chunk) => matchLogParser.onChunk(chunk),
      outputDir: path.join(__dirname, "tmp_matches"),
    });

    // act
    await gameLogParser.run();

    // assert
    const matches = await AppDataSource.getRepository(Match).find();
    expect(matches).toHaveLength(3);

    const matchIdentifiers = matches.map((m) => m.matchIdentifier);
    expect(matchIdentifiers.sort()).toEqual(["11348965", "11348966", "11348961"].sort());

    const players = await AppDataSource.getRepository(Player).find();
    expect(players.map((p) => p.name).sort()).toEqual(["Nick", "Roman", "Marcus", "Jhon", "Bryian", "Bryan"].sort());

    // TODO: check version with eager loading for less sql-like query building..
    const participantsByMatch = await AppDataSource
      .getRepository(MatchParticipant)
      .createQueryBuilder("mp")
      .leftJoin("mp.match", "match")
      .select("match.match_identifier")
      .addSelect("count(mp.id)", "mp_count")
      .groupBy("match.match_identifier")
      .getRawMany();

    expected_counts = [
      { match_identifier: '11348965', mp_count: '2' },
      { match_identifier: '11348961', mp_count: '5' },
      { match_identifier: '11348966', mp_count: '2' }
    ];
    expect(expected_counts).toEqual(expect.arrayContaining(participantsByMatch));

    // TODO: check version with eager loading for less sql-like query building..
    const kills = await AppDataSource
      .getRepository(Kill)
      .createQueryBuilder("kill")
      .innerJoin("kill.victim", "victim")
      .innerJoin("victim.player", "victim_player")
      .innerJoin("victim.match", "match")
      .leftJoin("kill.killer", "killer")
      .leftJoin("killer.player", "killer_player")
      .select("match.match_identifier", "match_id")
      .addSelect("killer_player.name", "killer_name")
      .addSelect("victim_player.name", "victim_name")
      .addSelect("kill.causeOfDeath", "cause_of_death")
      .getRawMany();

    expectedKills = [
      // first match
      {cause_of_death: 'M16', victim_name: 'Nick', killer_name: 'Roman', match_id: '11348965'},
      {cause_of_death: 'DROWN', victim_name: 'Nick', killer_name: null, match_id: '11348965'},
      // second match
      {cause_of_death: 'M16', victim_name: 'Marcus', killer_name: 'Roman', match_id: '11348966'},
      {cause_of_death: 'DROWN', victim_name: 'Marcus', killer_name: null, match_id: '11348966'},
      // third match
      {cause_of_death: 'M16', victim_name: 'Marcus', killer_name: 'Roman', match_id: '11348961'},
      {cause_of_death: 'AK47', victim_name: 'Jhon', killer_name: 'Marcus', match_id: '11348961'},
      {cause_of_death: 'M16', victim_name: 'Bryian', killer_name: 'Roman', match_id: '11348961'},
      {cause_of_death: 'AK47', victim_name: 'Marcus', killer_name: 'Bryan', match_id: '11348961'},
      {cause_of_death: 'DROWN', victim_name: 'Marcus', killer_name: null, match_id: '11348961'}
    ]
    expect(expectedKills).toEqual(expect.arrayContaining(kills));
  });
});
