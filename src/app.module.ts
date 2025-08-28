import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchLogUploadController } from './match_log_upload/match_log_upload.controller';
import { StorageModule } from './storage/storage.module';
import { MatchLog } from './match-logs/match-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
