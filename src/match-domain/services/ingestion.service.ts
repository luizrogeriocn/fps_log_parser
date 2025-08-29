import { Injectable } from '@nestjs/common';
import { MatchChunkConsumer } from '../ingestion/match-log-consumer'
import { MatchLogStreamer } from '../ingestion/match-log-streamer'
import { MatchService } from '../services/match.service';

@Injectable()
export class IngestionService {
  constructor(private readonly matchService: MatchService) {}

  async processFile(filePath: string) {
    const consumer = new MatchChunkConsumer(async (result) => {
      await this.matchService.saveChunk(result);
    });

    const streamer = new MatchLogStreamer({
      filePath,
      onChunk: (chunk) => consumer.onChunk(chunk),
    });

    await streamer.run();
  }
}
