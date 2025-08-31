import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchService } from '../services/match.service';
import { MatchLogParser } from '../ingestion/match-log-parser';
import type { MatchLogChunk } from '../ingestion/game-log-parser';

@Processor('match-logs')
export class MatchLogsProcessor extends WorkerHost {
  constructor(private readonly matchService: MatchService) {
    super();
  }

  async process(job: Job<MatchLogChunk>) {
    const chunk = job.data;

    console.log(`Processing match ${chunk.matchId} from file ${chunk.path}...`);

    const consumer = new MatchLogParser(async (result) => {
      await this.matchService.importMatch(result);
    });

    await consumer.onChunk(chunk);

    console.log(`Done processing match ${chunk.matchId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Match job ${job.id} completed`);
  }
}
