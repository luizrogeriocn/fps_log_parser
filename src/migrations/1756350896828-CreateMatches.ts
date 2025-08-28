import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMatches1756350896828 implements MigrationInterface {
  name = 'CreateMatches1756350896828'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "match_identifier" bigint NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "finished_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "match_log_id" uuid,
        CONSTRAINT "UQ_matches_match_identifier" UNIQUE ("match_identifier"),
        CONSTRAINT "PK_matches_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "matches"
      ADD CONSTRAINT "FK_matches_match_log" FOREIGN KEY ("match_log_id")
      REFERENCES "match_logs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_matches_match_log"`);
    await queryRunner.query(`DROP TABLE "matches"`);
  }
}
