import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1771471179359 implements MigrationInterface {
    name = 'InitialMigration1771471179359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" bigint NOT NULL DEFAULT '0', "locked_amount" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "version" character varying(50), "user_id" uuid, "asset_id" uuid, CONSTRAINT "UQ_898e8575f13306bb16deed97880" UNIQUE ("user_id", "asset_id"), CONSTRAINT "PK_74904758e813e401abc3d4261c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_balance_user_asset" ON "balances" ("user_id", "asset_id") `);
        await queryRunner.query(`CREATE TABLE "ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_type" character varying(50) NOT NULL, "direction" character varying(50) NOT NULL, "amount" bigint NOT NULL, "balance_after" bigint, "status" character varying(50) NOT NULL DEFAULT 'COMPLETED', "idempotencykey" character varying(255) NOT NULL, "description" character varying(500), "transaction_reference" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "asset_id" uuid, CONSTRAINT "UQ_e6dc753f6496ce76c9fea870fc1" UNIQUE ("idempotencykey"), CONSTRAINT "PK_7a322e9157e5f42a16750ba2a20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_ledger_created" ON "ledger" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_ledger_type_status" ON "ledger" ("transaction_type", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_ledger_user_asset" ON "ledger" ("user_id", "asset_id") `);
        await queryRunner.query(`CREATE TABLE "asset_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_763e7dc21d9c976ff47657db8f3" UNIQUE ("symbol"), CONSTRAINT "PK_2cf0314bcc4351b7f2827d57edb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_asset_symbol" ON "asset_types" ("symbol") `);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(50) NOT NULL, "amount" bigint NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'PENDING', "idempotencykey" character varying(255) NOT NULL, "transaction_reference" character varying(255), "metadata" text, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "from_user_id" uuid, "to_user_id" uuid, "asset_id" uuid, CONSTRAINT "UQ_1e1961a4c0d5595e4b4a5237c0b" UNIQUE ("idempotencykey"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_transaction_reference" ON "transactions" ("transaction_reference") `);
        await queryRunner.query(`CREATE INDEX "idx_transaction_created" ON "transactions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_transaction_status" ON "transactions" ("status") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "wallet_type" character varying(50) NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_user_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_864b90e3b151018347577be4f97" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_47cb693c2e361bf91c2ce9ae6e1" FOREIGN KEY ("asset_id") REFERENCES "asset_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ledger" ADD CONSTRAINT "FK_f010927e851c0368a15c587f89a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ledger" ADD CONSTRAINT "FK_504b890e5dfaa818841e5c05e6a" FOREIGN KEY ("asset_id") REFERENCES "asset_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2f91a8175c49ac211314033e208" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_cab8dd57a6d6d100a21ddc74679" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_92904cc4ab661f087cbcb60f404" FOREIGN KEY ("asset_id") REFERENCES "asset_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_92904cc4ab661f087cbcb60f404"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_cab8dd57a6d6d100a21ddc74679"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2f91a8175c49ac211314033e208"`);
        await queryRunner.query(`ALTER TABLE "ledger" DROP CONSTRAINT "FK_504b890e5dfaa818841e5c05e6a"`);
        await queryRunner.query(`ALTER TABLE "ledger" DROP CONSTRAINT "FK_f010927e851c0368a15c587f89a"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_47cb693c2e361bf91c2ce9ae6e1"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_864b90e3b151018347577be4f97"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transaction_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transaction_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transaction_reference"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP INDEX "public"."idx_asset_symbol"`);
        await queryRunner.query(`DROP TABLE "asset_types"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ledger_user_asset"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ledger_type_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ledger_created"`);
        await queryRunner.query(`DROP TABLE "ledger"`);
        await queryRunner.query(`DROP INDEX "public"."idx_balance_user_asset"`);
        await queryRunner.query(`DROP TABLE "balances"`);
    }

}
