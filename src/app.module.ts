import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchDomainModule } from './match-domain/match-domain.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    MatchDomainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
