import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';

// Entities
import { MatchLog } from './entities/match-log.entity';
import { Match } from './entities/match.entity';
import { Player } from './entities/player.entity';
import { MatchParticipant } from './entities/match-participant.entity';
import { Kill } from './entities/kill.entity';

// Services
import { MatchLogsService } from './services/match-logs.service';

// Controllers
import { MatchLogsController } from './controllers/match-logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchLog,
      Match,
      Player,
      MatchParticipant,
      Kill,
    ]),
    // TODO how to not use this?
    forwardRef(() => StorageModule),
  ],
  controllers: [
    MatchLogsController,
  ],
  providers: [
    MatchLogsService,
  ],
  exports: [
    TypeOrmModule,
    MatchLogsService,
  ],
})
export class MatchDomainModule {}
