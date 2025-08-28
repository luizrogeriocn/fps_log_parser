import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlayers1756360871434 implements MigrationInterface {
  name = 'CreatePlayers1756360871434'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "players" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_1b597c8eb2fadb72240d576fd0f" UNIQUE ("name"),
        CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_1b597c8eb2fadb72240d576fd0" ON "players" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_1b597c8eb2fadb72240d576fd0"`);
    await queryRunner.query(`DROP TABLE "players"`);
  }
}
