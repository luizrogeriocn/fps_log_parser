export abstract class StorageService {
  abstract uploadFile(file: Express.Multer.File): Promise<{ url: string }>;
}
