import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { entities } from './match-domain/entities';

const envPath = process.env.NODE_ENV == 'test' ? '.env.test' : '.env';

dotenv.config({path: envPath});

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: true,
});
