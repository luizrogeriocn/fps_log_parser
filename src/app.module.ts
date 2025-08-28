import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchLogsController } from './match-logs/match-logs.controller';
import { StorageModule } from './storage/storage.module';
import { MatchLog } from './match-logs/match-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { MatchLogsModule } from './match-logs/match-logs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    StorageModule,
    MatchLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
