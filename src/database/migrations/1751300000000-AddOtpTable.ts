import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddOtpTable1751300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'userType',
            type: 'enum',
            enum: ['user', 'owner'],
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'purpose',
            type: 'enum',
            enum: ['email_verification', 'password_reset'],
            default: "'email_verification'",
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_OTP_EMAIL_USERTYPE',
            columnNames: ['email', 'userType'],
          },
          {
            name: 'IDX_OTP_CODE',
            columnNames: ['code'],
          },
          {
            name: 'IDX_OTP_EXPIRES_AT',
            columnNames: ['expiresAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('otps');
  }
} 