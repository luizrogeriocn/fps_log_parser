import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...AppDataSource.options,
  autoLoadEntities: true,
};

export const TypeOrmDataSource = new DataSource(typeOrmConfig);
