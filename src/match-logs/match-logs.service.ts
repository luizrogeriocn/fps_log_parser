import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchLog, MatchLogStatus } from './match-log.entity';
import { StorageService } from '../storage/storage.interface';

@Injectable()
export class MatchLogsService {
  constructor(
    @InjectRepository(MatchLog)
    private readonly repo: Repository<MatchLog>,
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
