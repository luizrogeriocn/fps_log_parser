import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchService } from '../services/match.service';
import { MatchChunkConsumer } from '../ingestion/match-log-consumer';
import type { MatchChunk } from '../ingestion/match-log-streamer';

@Processor('match-logs')
export class MatchLogsProcessor extends WorkerHost {
  constructor(private readonly matchService: MatchService) {
    super();
  }

  async process(job: Job<MatchChunk>) {
    const chunk = job.data;

    console.log(`Processing match ${chunk.matchId} from file ${chunk.path}...`);

    const consumer = new MatchChunkConsumer(async (result) => {
      await this.matchService.saveChunk(result);
    });

    await consumer.onChunk(chunk);

    console.log(`Done processing match ${chunk.matchId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Match job ${job.id} completed`);
  }
}
