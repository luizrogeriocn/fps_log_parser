import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// A chunk of raw log lines corresponding to a single match.
export interface MatchChunk {
  matchId: string;
  text: string;
  startLine: number;
  endLine: number;
  complete: boolean;
  note?: string;
}

// options to configure the MatchLogStreamer.
export interface MatchLogStreamerOptions {
  filePath: string;
  onChunk: (chunk: MatchChunk) => void | Promise<void>;
  startRe?: RegExp;
  endRe?: RegExp;
  encoding?: BufferEncoding;
}

/**
 * A lightweight streaming splitter for possibly large game logs.
 * - Reads file as a stream
 * - Accumulates lines between "match start" and "match end"
 * - Hands the chunk to a provided consumer without parsing it itself
 */
export class MatchLogStreamer {
  private readonly filePath: string;
  private readonly onChunk: (chunk: MatchChunk) => void | Promise<void>;
  private readonly startRe: RegExp;
  private readonly endRe: RegExp;
  private readonly encoding: BufferEncoding;

  private active = false;
  private buffer: string[] = [];
  private currentMatchId: string;
  private startLineNo: number | null = null;
  private lineNo = 0;

  constructor({
    filePath,
    onChunk,
    startRe = /New match (\d+) has started/,
    endRe = /Match (\d+) has ended/,
    encoding = "utf8",
  }: MatchLogStreamerOptions) {
    if (!filePath) throw new Error("filePath is required");
    if (typeof onChunk !== "function") throw new Error("onChunk callback is required");

    // TODO: there might be a better way of solving this.
    filePath = path.resolve(process.cwd(), filePath)
    console.log(filePath)

    this.filePath = filePath;
    this.onChunk = onChunk;
    this.startRe = startRe;
    this.endRe = endRe;
    this.encoding = encoding;
  }

  /**
   * Starts streaming and splitting the file.
   * Resolves when fully processed (or rejects on stream error).
   */
  async run(): Promise<void> {
    if (this.active) throw new Error("This stream is already being ran");
    this.active = true;

    const stream = fs.createReadStream(this.filePath, { encoding: this.encoding });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    try {
      for await (const rawLine of rl) {
        const line = rawLine ?? "";
        this.lineNo += 1;
        await this.handleLine(line);
      }

      // if a match started but never ended, mark as incomplete (reached EOF)
      if (this.buffer.length > 0) {
        await this.emitChunk({
          matchId: this.currentMatchId,
          lines: this.buffer.slice(),
          startLine: this.startLineNo ?? Math.max(1, this.lineNo),
          endLine: this.lineNo,
          complete: false,
        });
      }
    } finally {
      rl.close();
      stream.close?.();
      // reset
      this.active = false;
      this.buffer = [];
      this.currentMatchId = "";
      this.startLineNo = null;
      this.lineNo = 0;
    }
  }

  private async handleLine(line: string): Promise<void> {
    // Start token?
    const start = line.match(this.startRe);
    if (start) {
      const newId = start[1];

      // If already buffering (missing end)
      if (this.buffer.length > 0) {
        await this.emitChunk({
          matchId: this.currentMatchId,
          lines: this.buffer.slice(),
          startLine: this.startLineNo ?? Math.max(1, this.lineNo - 1),
          endLine: this.lineNo - 1,
          complete: false,
        });
      }

      // Start fresh buffer
      this.buffer = [line];
      this.currentMatchId = newId;
      this.startLineNo = this.lineNo;
      return;
    }

    // If currently buffering, push the line and check for end token
    if (this.buffer.length > 0) {
      this.buffer.push(line);

      const end = line.match(this.endRe);
      if (end) {
        const endId = end[1];
        const idMismatch = !!(this.currentMatchId && endId !== this.currentMatchId);

        await this.emitChunk({
          matchId: this.currentMatchId ?? endId,
          lines: this.buffer.slice(),
          startLine: this.startLineNo ?? Math.max(1, this.lineNo),
          endLine: this.lineNo,
          complete: !idMismatch,
          note: idMismatch
            ? `End token (${endId}) did not match start token (${this.currentMatchId}).`
            : undefined,
        });

        // Reset buffer
        this.buffer = [];
        this.currentMatchId = "";
        this.startLineNo = null;
      }

      return;
    }
  }

  private async emitChunk(args: {
    matchId: string;
    lines: string[];
    startLine: number;
    endLine: number;
    complete: boolean;
    note?: string;
  }): Promise<void> {
    const chunk: MatchChunk = {
      matchId: args.matchId,
      text: args.lines.join("\n"),
      startLine: args.startLine,
      endLine: args.endLine,
      complete: args.complete,
      note: args.note,
    };

    await this.onChunk(chunk);
  }
}
