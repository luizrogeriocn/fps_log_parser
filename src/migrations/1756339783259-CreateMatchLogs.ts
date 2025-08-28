import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMatchLogs1756339783259 implements MigrationInterface {
    name = 'CreateMatchLogs1756339783259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."match_logs_status_enum" AS ENUM('uploaded', 'processing', 'processed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "match_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "status" "public"."match_logs_status_enum" NOT NULL DEFAULT 'uploaded', "processedAt" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5f6e8583ca97954e797efdaf428" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "match_logs"`);
        await queryRunner.query(`DROP TYPE "public"."match_logs_status_enum"`);
    }

}
