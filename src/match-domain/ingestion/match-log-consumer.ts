import type { MatchChunk } from "./match-log-streamer.js";

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
  startTime: Date | null;
  endTime: Date | null;
  note?: string;
}

/**
 * Consumer that extracts participants and kill events from a MatchChunk.
 * 
 * IMPORTANT: It does not parse or validate non-kill lines.
 */
export class MatchChunkConsumer {
  constructor(
    private readonly onResult?: (result: ChunkExtraction) => void | Promise<void>
  ) {}

  /**
   * Extracts participants and kills from the chunk text and build a structured result.
   * `onResult` allows the caller to receive the structured output.
   */
  async onChunk(chunk: MatchChunk): Promise<void> {
    const tsAndMsgRe = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+)$/;
    const weaponKillRe = /^(.+?)\s+killed\s+(.+?)\s+using\s+(.+)\s*$/;
    const worldKillRe = /^<WORLD>\s+killed\s+(.+?)\s+by\s+(.+)\s*$/;
    const startRe = /^New match (\d+) has started$/;
    const endRe = /^Match (\d+) has ended$/;

    const participants = new Set<string>();
    const kills: KillRecord[] = [];
    let startTime: Date | null = null;
    let endTime: Date | null = null;

    const lines = chunk.text.split(/\r?\n/);

    // compute the absolute file line number for each line in the chunk using chunk.startLine
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const fileLineNo = (chunk.startLine ?? 1) + i;

      // get timestamp + message
      const tsMatch = raw.match(tsAndMsgRe);
      if (!tsMatch) {
        continue; // this is not a known event line -> skip
      }

      const [, tsStr, msg] = tsMatch;
      const timestamp = parseDateTimeString(tsStr);

      // Detect start/end lines
      if (msg.match(startRe)) {
        startTime = timestamp;
        continue;
      }
      if (msg.match(endRe)) {
        endTime = timestamp;
        continue;
      }

      // check world kill
      {
        const m = msg.match(worldKillRe);
        if (m) {
          const victim = m[1].trim();
          const cause = m[2].trim();

          // <WORLD> is not counted as a participant so we dont consider the killer
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
      }

      // check for weapon kill
      {
        const m = msg.match(weaponKillRe);
        if (m) {
          const killer = m[1].trim();
          const victim = m[2].trim();
          const weapon = m[3].trim();

          // Count only real player names as participants
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
    }

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

    // If a callback was provided, hand off the result; otherwise, log a summary.
    if (this.onResult) {
      await this.onResult(result);
    } else {
      console.log(
        `matchIdentifier=${result.matchIdentifier ?? "?"} complete=${result.complete} ` +
          `participants=${result.participants.length} kills=${result.kills.length} ` +
          `start=${result.startTime} end=${result.endTime}`
      );
    }
  }
}

// TODO: move this inside the class as a private method
function parseDateTimeString(dateTimeString: string): Date {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
};
