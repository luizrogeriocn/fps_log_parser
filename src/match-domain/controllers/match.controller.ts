import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GameLogService } from '../services/game-log.service';
import { AnalysisService } from '../services/analysis.service';

@Controller('match_logs')
export class MatchController {
  constructor(
    private readonly service: GameLogService,
    private readonly analysisService: AnalysisService,
    @InjectQueue('game-logs') private readonly gameLogsQueue: Queue,
    @InjectQueue('match-logs') private readonly matchLogsQueue: Queue
  ) {}

  @Get('upload')
  getUploadForm() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Upload File</title>
        </head>
        <body>
          <h1>Upload File</h1>
          <form action="/match_logs/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file" />
            <button type="submit">Upload</button>
          </form>
        </body>
      </html>
    `;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() uploadedFile: Express.Multer.File) {
    const file = await this.service.createFromUpload(uploadedFile);

    // enqueue for processing
    await this.gameLogsQueue.add('processLog', { path: file.url });

    return file;
  }

  @Get('match')
  async getMatchScores(@Query('externalId') externalId: string) {
    return this.analysisService.calculateScores(externalId);
  }

  @Get('global')
  async getGlobalLeaderboard() {
    return this.analysisService.getGlobalLeaderboard();
  }
}
