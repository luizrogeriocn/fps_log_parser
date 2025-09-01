import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1756330000000 implements MigrationInterface {
  name = 'Init1756330000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP EXTENSION IF EXISTS "uuid-ossp";
    `);
  }
}
