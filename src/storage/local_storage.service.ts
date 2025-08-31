import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { StorageService } from './storage.interface';

@Injectable()
export class LocalStorageService extends StorageService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    // TODO: find a better way of doing this 
    const uploadPath = join(__dirname, '..', '..',  'uploads');
    await fs.mkdir(uploadPath, { recursive: true });

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = join(uploadPath, fileName);
    await fs.writeFile(filePath, file.buffer);

    return { url: `uploads/${fileName}` };
  }
}
