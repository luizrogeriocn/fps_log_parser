import fs from "node:fs";
import path from "node:path";
import { MatchLogParser, ChunkExtraction } from "../src/match-domain/ingestion/match-log-parser";
import { GameLogParser, MatchLogChunk } from "../src/match-domain/ingestion/game-log-parser";

describe("Integration: GameLogParser → MatchLogParser", () => {
  const tmpDir = path.join(process.cwd(), "tmp_test_matches");
  const testFile = path.join(tmpDir, "integration-test.log");

  beforeAll(() => {
    // clean and recreate tmp dir
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should split a log into chunks and parse each with MatchLogParser", async () => {
    const log = `
24/04/2020 16:14:22 - New match 111 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed John using AK47
24/04/2020 17:12:34 - Roman killed Bryan using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 111 has ended
24/04/2020 21:00:00 - New match 222 has started
24/04/2020 21:10:00 - Roman killed John using AK47
24/04/2020 21:20:00 - Match 222 has ended
    `;

    fs.writeFileSync(testFile, log, "utf8");

    const parsedMatches: ChunkExtraction[] = [];

    // wire the parsers together
    const matchLogParser = new MatchLogParser((result) => {
      parsedMatches.push(result);
    });

    const gameLogParser = new GameLogParser({
      filePath: testFile,
      outputDir: tmpDir,
      onChunk: async (chunk: MatchLogChunk) => {
        await matchLogParser.onChunk(chunk);
      },
    });

    await gameLogParser.run();

    // assert there are two matches
    expect(parsedMatches).toHaveLength(2);

    const [first, second] = parsedMatches;

    expect(first.matchIdentifier).toBe("111");
    expect(first.participants.sort()).toEqual(
      ["Roman", "Marcus", "John", "Bryan"].sort()
    );
    expect(first.kills).toHaveLength(5);
    expect(first.startTime).toBeInstanceOf(Date);
    expect(first.endTime).toBeInstanceOf(Date);

    const worldKill = first.kills.find((k) => k.isWorldKill);
    expect(worldKill).toBeDefined();
    expect(worldKill!.killer).toBe("<WORLD>");

    expect(second.matchIdentifier).toBe("222");
    expect(second.participants.sort()).toEqual(["Roman", "John"].sort());
    expect(second.kills).toHaveLength(1);
  });
});
