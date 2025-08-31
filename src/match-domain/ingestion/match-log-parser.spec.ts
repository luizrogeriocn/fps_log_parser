import fs from "node:fs";
import path from "node:path";
import { MatchLogParser, ChunkExtraction } from "./match-log-parser";
import type { MatchLogChunk } from "./game-log-parser";

describe("MatchLogParser", () => {
  const tmpDir = path.join(process.cwd(), "tmp_test_matches");
  const tmpFile = path.join(tmpDir, "test-log.txt");

  beforeAll(() => {
    // ensure fresh directory exists
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    // remove the file aftes each test
    if (tmpFile && fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  });

  afterAll(() => {
    // remove entire directory after tests finish
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should parse participants, kills, and match timestamps", async () => {
    const log = `
24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed Jhon using AK47
24/04/2020 17:12:34 - Roman killed Bryian using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 11348961 has ended
    `;

    fs.writeFileSync(tmpFile, log, "utf8");

    const chunk: MatchLogChunk = {
      matchId: "11348961",
      path: tmpFile,
      startLine: 1,
      endLine: 7,
      complete: true,
    };

    let parsed: ChunkExtraction | undefined;
    const parser = new MatchLogParser((result) => {
      parsed = result;
    });

    await parser.onChunk(chunk);

    expect(parsed).toBeDefined();
    expect(parsed!.matchIdentifier).toBe("11348961");
    expect(parsed!.participants.sort()).toEqual(
      ["Roman", "Marcus", "Jhon", "Bryian", "Bryan"].sort()
    );

    expect(parsed!.kills).toHaveLength(5);

    // check first kill
    const firstKill = parsed!.kills[0];
    expect(firstKill.killer).toBe("Roman");
    expect(firstKill.victim).toBe("Marcus");
    expect(firstKill.causeOfDeath).toBe("M16");
    expect(firstKill.isWorldKill).toBe(false);

    // check world kill
    const worldKill = parsed!.kills.find((k) => k.isWorldKill);
    expect(worldKill).toBeDefined();
    expect(worldKill!.killer).toBe("<WORLD>");
    expect(worldKill!.victim).toBe("Marcus");
    expect(worldKill!.causeOfDeath).toBe("DROWN");

    // check start/end times
    expect(parsed!.startTime).toBeInstanceOf(Date);
    expect(parsed!.endTime).toBeInstanceOf(Date);
    expect(parsed!.endTime.getTime()).toBeGreaterThan(parsed!.startTime.getTime());
  });

  it("should throw if match has no end timestamp", async () => {
    const log = `
24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
    `;

    fs.writeFileSync(tmpFile, log, "utf8");

    const chunk: MatchLogChunk = {
      matchId: "11348961",
      path: tmpFile,
      startLine: 1,
      endLine: 2,
      complete: true,
    };

    const parser = new MatchLogParser();

    await expect(parser.onChunk(chunk)).rejects.toThrow(
      /missing start or end timestamp/
    );
  });

  it("should throw if match has no start timestamp", async () => {
    const log = `
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 20:19:22 - Match 11348961 has ended
    `;

    fs.writeFileSync(tmpFile, log, "utf8");

    const chunk: MatchLogChunk = {
      matchId: "11348961",
      path: tmpFile,
      startLine: 1,
      endLine: 2,
      complete: true,
    };

    const parser = new MatchLogParser();

    await expect(parser.onChunk(chunk)).rejects.toThrow(
      /missing start or end timestamp/
    );
  });

  it("should ignore malformed lines", async () => {
    const log = `
this is some garbage line without timestamp
24/04/2020 16:14:22 - New match 11348961 has started
nonsense that does not match anything
24/04/2020 20:19:22 - Match 11348961 has ended
    `;

    fs.writeFileSync(tmpFile, log, "utf8");

    const chunk: MatchLogChunk = {
      matchId: "11348961",
      path: tmpFile,
      startLine: 1,
      endLine: 4,
      complete: true,
    };

    let parsed: ChunkExtraction | undefined;
    const parser = new MatchLogParser((result) => {
      parsed = result;
    });

    await parser.onChunk(chunk);

    expect(parsed).toBeDefined();
    expect(parsed!.matchIdentifier).toBe("11348961");
    expect(parsed!.participants).toEqual([]);
    expect(parsed!.kills).toHaveLength(0);
  });
});
