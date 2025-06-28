import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLatLongToString1751115462247 implements MigrationInterface {
    name = 'UpdateLatLongToString1751115462247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, delete all existing shops to avoid null constraint issues
        await queryRunner.query(`DELETE FROM "shops"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "lat" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "long"`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "long" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "long"`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "long" numeric(10,6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "lat" numeric(10,6) NOT NULL`);
    }

}
