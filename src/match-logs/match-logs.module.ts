import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchLog } from './match-log.entity';
import { MatchLogsService } from './match-logs.service';
import { MatchLogsController } from './match-logs.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([MatchLog]), StorageModule],
  providers: [MatchLogsService],
  controllers: [MatchLogsController],
  exports: [TypeOrmModule],
})
export class MatchLogsModule {}
