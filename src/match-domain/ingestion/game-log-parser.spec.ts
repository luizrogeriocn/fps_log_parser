import fs from "node:fs";
import path from "node:path";
import { GameLogParser } from "./game-log-parser";
import type { MatchLogChunk } from "./game-log-parser";

describe("GameLogParser", () => {
  const tmpDir = path.join(__dirname, "tmp_test_matches");
  const testFile = path.join(tmpDir, "test.log");

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    // cleanup all files inside tmpDir
    // should check for a better way to find the project root and
    // create these files there. also should remove the folder entirely
    // in the teardown.
    for (const f of fs.readdirSync(tmpDir)) {
      fs.unlinkSync(path.join(tmpDir, f));
    }
  });

  it("should emit chunks for complete matches", async () => {
    const log = `
24/04/2020 16:14:22 - New match 111 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 20:19:22 - Match 111 has ended
24/04/2020 21:00:00 - New match 222 has started
24/04/2020 21:10:00 - <WORLD> killed Marcus by DROWN
24/04/2020 21:20:00 - Match 222 has ended
    `;

    fs.writeFileSync(testFile, log, "utf8");

    const chunks: MatchLogChunk[] = [];
    const parser = new GameLogParser({
      filePath: testFile,
      outputDir: tmpDir,
      onChunk: (chunk) => chunks.push(chunk),
    });

    await parser.run();

    expect(chunks).toHaveLength(2);

    const [first, second] = chunks;
    expect(first.matchId).toBe("111");
    expect(first.complete).toBe(true);
    expect(fs.existsSync(first.path)).toBe(true);

    expect(second.matchId).toBe("222");
    expect(second.complete).toBe(true);
  });

  it("should emit incomplete chunk if match has no end", async () => {
    const log = `
24/04/2020 16:14:22 - New match 333 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
    `;

    fs.writeFileSync(testFile, log, "utf8");

    const chunks: MatchLogChunk[] = [];
    const parser = new GameLogParser({
      filePath: testFile,
      outputDir: tmpDir,
      onChunk: (chunk) => chunks.push(chunk),
    });

    await parser.run();

    expect(chunks).toHaveLength(1);
    expect(chunks[0].matchId).toBe("333");
    expect(chunks[0].complete).toBe(false);
  });

  it("should mark note if end token does not match start", async () => {
    const log = `
24/04/2020 16:14:22 - New match 444 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 20:19:22 - Match 555 has ended
    `;

    fs.writeFileSync(testFile, log, "utf8");

    const chunks: MatchLogChunk[] = [];
    const parser = new GameLogParser({
      filePath: testFile,
      outputDir: tmpDir,
      onChunk: (chunk) => chunks.push(chunk),
    });

    await parser.run();

    expect(chunks).toHaveLength(1);
    expect(chunks[0].matchId).toBe("444");
    expect(chunks[0].complete).toBe(false);
    expect(chunks[0].note).toMatch(/did not match/);
  });
});
