import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagesToShops1751200000000 implements MigrationInterface {
    name = 'AddImagesToShops1751200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shops" 
            ADD COLUMN "image" varchar,
            ADD COLUMN "images" json
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shops" 
            DROP COLUMN "image",
            DROP COLUMN "images"
        `);
    }
} 