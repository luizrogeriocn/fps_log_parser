import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateKills1756360871656 implements MigrationInterface {
  name = 'CreateKills1756360871656'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "happened_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "cause_of_death" character varying(120) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "killer_match_participant_id" uuid, "victim_match_participant_id" uuid,
        CONSTRAINT "PK_a942b5b49eb07d42cc127857da0" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_56cf14ce573e15542df27b3de2" ON "kills" ("killer_match_participant_id")
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_af51167ff34b04ab78a41ddfe7" ON "kills" ("victim_match_participant_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "kills"
      ADD CONSTRAINT "FK_56cf14ce573e15542df27b3de24"
      FOREIGN KEY ("killer_match_participant_id")
      REFERENCES "match_participants"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "kills"
      ADD CONSTRAINT "FK_af51167ff34b04ab78a41ddfe7c"
      FOREIGN KEY ("victim_match_participant_id")
      REFERENCES "match_participants"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "kills" DROP CONSTRAINT "FK_af51167ff34b04ab78a41ddfe7c"`);
    await queryRunner.query(`ALTER TABLE "kills" DROP CONSTRAINT "FK_56cf14ce573e15542df27b3de24"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af51167ff34b04ab78a41ddfe7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_56cf14ce573e15542df27b3de2"`);
    await queryRunner.query(`DROP TABLE "kills"`);
  }
}
