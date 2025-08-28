import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMatchParticipants1756360871545 implements MigrationInterface {
  name = 'CreateMatchParticipants1756360871545'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "match_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "match_id" uuid,
        "player_id" uuid,
        CONSTRAINT "PK_ad88db39fec4c7425084267fb20" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "match_participants"
      ADD CONSTRAINT "FK_065584e9a7b86a9ad63180af39e"
      FOREIGN KEY ("match_id")
      REFERENCES "matches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_participants"
      ADD CONSTRAINT "FK_4976f49b9d06b2c073cf438992d"
      FOREIGN KEY ("player_id")
      REFERENCES "players"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "match_participants" DROP CONSTRAINT "FK_4976f49b9d06b2c073cf438992d"`);
      await queryRunner.query(`ALTER TABLE "match_participants" DROP CONSTRAINT "FK_065584e9a7b86a9ad63180af39e"`);
      await queryRunner.query(`DROP TABLE "match_participants"`);
  }
}
