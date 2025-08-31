import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// A chunk of raw log lines corresponding to a single match.
export interface MatchLogChunk {
  matchId: string;
  path: string;
  startLine: number;
  endLine: number;
  complete: boolean;
  note?: string;
}

// options to configure the MatchLogStreamer.
export interface GameLogParserOptions {
  filePath: string;
  onChunk: (chunk: MatchLogChunk) => void | Promise<void>;
  outputDir?: string;
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
export class GameLogParser {
  private readonly filePath: string;
  private readonly onChunk: (chunk: MatchLogChunk) => void | Promise<void>;
  private readonly startRe: RegExp;
  private readonly endRe: RegExp;
  private readonly encoding: BufferEncoding;
  private readonly outputDir: string;

  private active = false;
  private currentMatchId = "";
  private startLineNo: number | null = null;
  private lineNo = 0;
  private currentStream: fs.WriteStream | null = null;
  private currentFilePath: string | null = null;

  constructor({
    filePath,
    onChunk,
    startRe = /New match (\d+) has started/,
    endRe = /Match (\d+) has ended/,
    encoding = "utf8",
    outputDir = path.join(process.cwd(), "tmp_matches"),
  }: GameLogParserOptions) {
    if (!filePath) throw new Error("filePath is required");
    if (typeof onChunk !== "function") throw new Error("onChunk callback is required");

    // TODO: there might be a better way of solving this.
    filePath = path.resolve(process.cwd(), filePath)

    this.filePath = filePath;
    this.onChunk = onChunk;
    this.startRe = startRe;
    this.endRe = endRe;
    this.encoding = encoding;
    this.outputDir = outputDir;

    // ensure output directory exists
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  /**
   * Starts streaming and splitting the file.
   * Resolves when fully processed (or rejects on stream error).
   */
  async run(): Promise<void> {
    if (this.active) throw new Error("This stream is already running");
    this.active = true;

    const stream = fs.createReadStream(this.filePath, { encoding: this.encoding });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    try {
      for await (const rawLine of rl) {
        const line = rawLine ?? "";
        this.lineNo += 1;
        await this.handleLine(line);
      }

      // if match started but never ended, flush as incomplete
      if (this.currentStream) {
        await this.closeAndEmit(false);
      }
    } finally {
      rl.close();
      stream.close?.();

      this.active = false;
      this.currentMatchId = "";
      this.startLineNo = null;
      this.lineNo = 0;
      this.currentStream = null;
      this.currentFilePath = null;
    }
  }

  private async handleLine(line: string): Promise<void> {
    // Start token?
    const start = line.match(this.startRe);
    if (start) {
      const newId = start[1];

      // If already streaming another match (no end yet)
      if (this.currentStream) {
        await this.closeAndEmit(false);
      }

      this.currentMatchId = newId;
      this.startLineNo = this.lineNo;

      this.currentFilePath = path.join(this.outputDir, `${newId}.log`);
      this.currentStream = fs.createWriteStream(this.currentFilePath, {
        flags: "w",
        encoding: this.encoding,
      });

      this.currentStream.write(line + "\n");
      return;
    }

    // If currently streaming a match
    if (this.currentStream) {
      this.currentStream.write(line + "\n");

      const end = line.match(this.endRe);
      if (end) {
        const endId = end[1];
        const idMismatch = !!(this.currentMatchId && endId !== this.currentMatchId);

        await this.closeAndEmit(!idMismatch, idMismatch
          ? `End token (${endId}) did not match start token (${this.currentMatchId}).`
          : undefined);
      }
    }
  }

  private async closeAndEmit(
    complete: boolean,
    note?: string,
  ): Promise<void> {
    if (!this.currentStream || !this.currentFilePath) return;

    await new Promise((resolve) => this.currentStream?.end(resolve));

    const chunk: MatchLogChunk = {
      matchId: this.currentMatchId,
      path: this.currentFilePath,
      startLine: this.startLineNo ?? 1,
      endLine: this.lineNo,
      complete,
      note,
    };

    await this.onChunk(chunk);

    // reset
    this.currentStream = null;
    this.currentFilePath = null;
    this.currentMatchId = "";
    this.startLineNo = null;
  }
}
