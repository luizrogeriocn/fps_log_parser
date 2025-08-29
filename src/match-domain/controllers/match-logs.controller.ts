import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchLogsService } from '../services/match-logs.service';
import { IngestionService } from '../services/ingestion.service';

@Controller('match_logs')
export class MatchLogsController {
  constructor(private readonly service: MatchLogsService, private readonly ingestionService: IngestionService) {}

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
  async upload(@UploadedFile() file: Express.Multer.File) {
    const diskFile = this.service.createFromUpload(file);

    // TODO: this should queue a background job
    this.ingestionService.processFile((await diskFile).url);
    return diskFile;
  }
}
