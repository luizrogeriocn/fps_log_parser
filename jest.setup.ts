import { QueryRunner } from 'typeorm';
import { Test } from '@nestjs/testing';
import { AppModule } from './src/app.module';
import { AppDataSource } from './src/data-source';

let queryRunner: QueryRunner;
let app: INestApplication;

beforeAll(async () => {
  await AppDataSource.initialize();

  queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.startTransaction();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('DATA_SOURCE')
    .useValue(AppDataSource)
    .compile();

  app = moduleRef.createNestApplication();
  await app.init();
});

beforeEach(async () => {
  await queryRunner.query('SAVEPOINT sp');

  AppDataSource.manager = queryRunner.manager;
});

afterEach(async () => {
  await queryRunner.query('ROLLBACK TO SAVEPOINT sp');
});

afterAll(async () => {
  await queryRunner.rollbackTransaction();
  await queryRunner.release();
  await AppDataSource.destroy();
  await app.close();
});

export { AppDataSource };
