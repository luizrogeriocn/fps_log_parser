import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IngestionService } from '../services/ingestion.service';

@Processor('game-logs')
export class GameLogsProcessor extends WorkerHost {
  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job<{ path: string }>) {
    const { path } = job.data;

    console.log(`Processing game log file: ${path}`);
    await this.ingestion.processFile(path);
    console.log(`Done processing game log file: ${path}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Game log job ${job.id} completed`);
  }
}
