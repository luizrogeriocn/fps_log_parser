import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchLogUploadController } from './match_log_upload/match_log_upload.controller';

@Module({
  imports: [],
  controllers: [AppController, MatchLogUploadController],
  providers: [AppService],
})
export class AppModule {}
