import { Module } from '@nestjs/common';
import { LocalStorageService } from './local_storage.service';
import { StorageService } from './storage.interface';

@Module({
  providers: [
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}

