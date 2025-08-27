import { Test, TestingModule } from '@nestjs/testing';
import { MatchLogUploadController } from './match_log_upload.controller';

describe('MatchLogUploadController', () => {
  let controller: MatchLogUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchLogUploadController],
    }).compile();

    controller = module.get<MatchLogUploadController>(MatchLogUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
