import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MatchLogsService } from '../services/match-logs.service';

@Controller('match_logs')
export class MatchLogsController {
  constructor(
    private readonly service: MatchLogsService,
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
}
