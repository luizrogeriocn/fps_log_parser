import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GameLogService } from '../services/game-log.service';
import { AnalysisService } from '../services/analysis.service';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly gameLogService: GameLogService,
    private readonly analysisService: AnalysisService,
    @InjectQueue('game-logs') private readonly gameLogsQueue: Queue,
    @InjectQueue('match-logs') private readonly matchLogsQueue: Queue
  ) {}

  @Get()
  async getGlobalLeaderboard() {
    return this.analysisService.getGlobalLeaderboard();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() uploadedFile: Express.Multer.File) {
    if (!uploadedFile) {
      throw new BadRequestException('No file uploaded');
    }

    const gameLog = await this.gameLogService.createFromUpload(uploadedFile);

    // enqueue for processing
    await this.gameLogsQueue.add('processLog', { path: gameLog.url });
    return {
      message: 'File uploaded successfully',
      gameLog,
    };
  }

  @Get(':match_id')
  async getMatchScores(@Param('match_id') externalId: string) {
    if (!/^\d+$/.test(externalId)) {
      throw new BadRequestException('Parameter must be a numeric string');
    }

    return this.analysisService.getMatchLeaderboard(externalId);
  }
}
