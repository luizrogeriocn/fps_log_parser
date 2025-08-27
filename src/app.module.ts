import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchLogUploadController } from './match_log_upload/match_log_upload.controller';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AppController, MatchLogUploadController],
  providers: [AppService],
})
export class AppModule {}
