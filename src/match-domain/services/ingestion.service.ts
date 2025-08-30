import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MatchLogStreamer } from '../ingestion/match-log-streamer';

@Injectable()
export class IngestionService {
  constructor(@InjectQueue('match-logs') private readonly matchLogsQueue: Queue) {}

  async processFile(filePath: string) {
    const streamer = new MatchLogStreamer({
      filePath,
      // instead of consuming, enqueue each chunk
      onChunk: async (chunk) => {
        await this.matchLogsQueue.add('process-match', {
          path: chunk.path,
          matchId: chunk.matchId,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          complete: chunk.complete,
          note: chunk.note,
        });
        console.log(`Enqueued match ${chunk.matchId} from ${filePath}`);
      },
    });

    await streamer.run();
  }
}
