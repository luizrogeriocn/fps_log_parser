import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameLog, MatchLogStatus } from '../entities/game-log.entity';
import { StorageService } from '../../storage/storage.interface';

@Injectable()
export class GameLogService {
  constructor(
    @InjectRepository(GameLog)
    private readonly repo: Repository<GameLog>,
    private readonly storage: StorageService
  ) {}

  async createFromUpload(file: Express.Multer.File) {
    const { url } = await this.storage.uploadFile(file);

    const entity = this.repo.create({
      url,
      status: MatchLogStatus.Uploaded,
      processedAt: null,
    });

    return this.repo.save(entity);
  }
}
