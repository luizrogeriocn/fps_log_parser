import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { BullModule } from '@nestjs/bullmq';

// Entities
import { MatchLog } from './entities/match-log.entity';
import { Match } from './entities/match.entity';
import { Player } from './entities/player.entity';
import { MatchParticipant } from './entities/match-participant.entity';
import { Kill } from './entities/kill.entity';

// Services
import { MatchService } from './services/match.service';
import { MatchLogsService } from './services/match-logs.service';
import { IngestionService } from './services/ingestion.service';
import { AnalysisService } from './services/analysis.service';

// Controllers
import { MatchLogsController } from './controllers/match-logs.controller';

// Processors
import { GameLogsProcessor } from './workers/game-logs.processor';
import { MatchLogsProcessor } from './workers/match-logs.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchLog,
      Match,
      Player,
      MatchParticipant,
      Kill,
    ]),
    BullModule.registerQueue({name: 'game-logs'}),
    BullModule.registerQueue({name: 'match-logs',}),
    // TODO how to not use this?
    forwardRef(() => StorageModule),
  ],
  controllers: [
    MatchLogsController,
  ],
  providers: [
    MatchService,
    MatchLogsService,
    IngestionService,
    AnalysisService,
    GameLogsProcessor,
    MatchLogsProcessor,
  ],
  exports: [
    TypeOrmModule,
    GameLogService,
  ],
})
export class MatchDomainModule {}
