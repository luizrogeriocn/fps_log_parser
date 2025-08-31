import fs from "node:fs";
import readline from "node:readline";
import type { MatchLogChunk } from "./game-log-parser.js";

// TODO: maybe put these interfaces in their own files
export interface KillRecord {
  timestamp: Date | null;
  killer: string;
  victim: string;
  causeOfDeath: string;
  isWorldKill: boolean;
  rawLine: string;
  lineNo: number;
}

export interface ChunkExtraction {
  matchIdentifier: string;
  complete: boolean;
  startLine: number;
  endLine: number;
  participants: string[];
  kills: KillRecord[];
  startTime: Date;
  endTime: Date;
  note?: string;
}

/**
 * Consumer that extracts participants and kill events from a MatchChunk.
 * 
 * IMPORTANT: It now reads directly from the file path in MatchChunk.
 */
export class MatchLogParser {
  constructor(
    private readonly onResult?: (result: ChunkExtraction) => void | Promise<void>
  ) {}

  async onChunk(chunk: MatchLogChunk): Promise<void> {
    const tsAndMsgRe = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+)$/;
    const weaponKillRe = /^(.+?)\s+killed\s+(.+?)\s+using\s+(.+)\s*$/;
    const worldKillRe = /^<WORLD>\s+killed\s+(.+?)\s+by\s+(.+)\s*$/;
    const startRe = /^New match (\d+) has started$/;
    const endRe = /^Match (\d+) has ended$/;

    const participants = new Set<string>();
    const kills: KillRecord[] = [];
    let startTime: Date | null = null;
    let endTime: Date | null = null;

    // stream the file instead of splitting text
    const fileStream = fs.createReadStream(chunk.path, { encoding: "utf8" });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineIndex = 0;
    for await (const raw of rl) {
      const fileLineNo = (chunk.startLine ?? 1) + lineIndex;
      lineIndex++;

      const tsMatch = raw.match(tsAndMsgRe);
      if (!tsMatch) continue;

      const [, tsStr, msg] = tsMatch;
      const timestamp = parseDateTimeString(tsStr);

      // start/end lines
      if (msg.match(startRe)) {
        startTime = timestamp;
        continue;
      }
      if (msg.match(endRe)) {
        endTime = timestamp;
        continue;
      }

      // world kill
      const wk = msg.match(worldKillRe);
      if (wk) {
        const victim = wk[1].trim();
        const cause = wk[2].trim();
        participants.add(victim);
        kills.push({
          timestamp,
          killer: "<WORLD>",
          victim,
          causeOfDeath: cause,
          isWorldKill: true,
          rawLine: raw,
          lineNo: fileLineNo,
        });
        continue;
      }

      // weapon kill
      const mk = msg.match(weaponKillRe);
      if (mk) {
        const killer = mk[1].trim();
        const victim = mk[2].trim();
        const weapon = mk[3].trim();
        if (killer !== "<WORLD>") participants.add(killer);
        participants.add(victim);
        kills.push({
          timestamp,
          killer,
          victim,
          causeOfDeath: weapon,
          isWorldKill: killer === "<WORLD>",
          rawLine: raw,
          lineNo: fileLineNo,
        });
        continue;
      }
    }

    rl.close();
    fs.unlink(chunk.path, (err) => {});

    if (startTime && endTime) {
      const result: ChunkExtraction = {
        matchIdentifier: chunk.matchId,
        complete: chunk.complete,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        participants: Array.from(participants),
        kills,
        startTime,
        endTime,
        note: chunk.note,
      };

      if (this.onResult) {
        console.log("onResult");
        await this.onResult(result);
      } else {
        console.log(
          `matchIdentifier=${result.matchIdentifier} complete=${result.complete} ` +
          `participants=${result.participants.length} kills=${result.kills.length} ` +
          `start=${result.startTime} end=${result.endTime}`
        );
      }
    } else {
      throw new Error(`Match ${chunk.matchId}: missing start or end timestamp`);
    }
  }
}

function parseDateTimeString(dateTimeString: string): Date {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}
