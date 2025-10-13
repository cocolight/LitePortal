import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1760357981397 implements MigrationInterface {
    name = 'Auto1760357981397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "init" ("key" varchar PRIMARY KEY NOT NULL, "value" boolean NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"))`);
        await queryRunner.query(`CREATE TABLE "link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "link_id" varchar NOT NULL, "name" varchar NOT NULL, "online_icon" varchar, "text_icon" varchar, "upload_icon" varchar, "paid_icon" varchar, "icon_type" varchar NOT NULL DEFAULT ('online_icon'), "int_url" varchar, "ext_url" varchar, "desc" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "userId" integer, CONSTRAINT "UQ_2c169f0fae14774f9787954ae6f" UNIQUE ("link_id"))`);
        await queryRunner.query(`CREATE TABLE "temporary_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "link_id" varchar NOT NULL, "name" varchar NOT NULL, "online_icon" varchar, "text_icon" varchar, "upload_icon" varchar, "paid_icon" varchar, "icon_type" varchar NOT NULL DEFAULT ('online_icon'), "int_url" varchar, "ext_url" varchar, "desc" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "userId" integer, CONSTRAINT "UQ_2c169f0fae14774f9787954ae6f" UNIQUE ("link_id"), CONSTRAINT "FK_14a562b14bb83fc8ba73d30d3e0" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_link"("id", "link_id", "name", "online_icon", "text_icon", "upload_icon", "paid_icon", "icon_type", "int_url", "ext_url", "desc", "created_at", "updated_at", "deleted_at", "userId") SELECT "id", "link_id", "name", "online_icon", "text_icon", "upload_icon", "paid_icon", "icon_type", "int_url", "ext_url", "desc", "created_at", "updated_at", "deleted_at", "userId" FROM "link"`);
        await queryRunner.query(`DROP TABLE "link"`);
        await queryRunner.query(`ALTER TABLE "temporary_link" RENAME TO "link"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "link" RENAME TO "temporary_link"`);
        await queryRunner.query(`CREATE TABLE "link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "link_id" varchar NOT NULL, "name" varchar NOT NULL, "online_icon" varchar, "text_icon" varchar, "upload_icon" varchar, "paid_icon" varchar, "icon_type" varchar NOT NULL DEFAULT ('online_icon'), "int_url" varchar, "ext_url" varchar, "desc" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "userId" integer, CONSTRAINT "UQ_2c169f0fae14774f9787954ae6f" UNIQUE ("link_id"))`);
        await queryRunner.query(`INSERT INTO "link"("id", "link_id", "name", "online_icon", "text_icon", "upload_icon", "paid_icon", "icon_type", "int_url", "ext_url", "desc", "created_at", "updated_at", "deleted_at", "userId") SELECT "id", "link_id", "name", "online_icon", "text_icon", "upload_icon", "paid_icon", "icon_type", "int_url", "ext_url", "desc", "created_at", "updated_at", "deleted_at", "userId" FROM "temporary_link"`);
        await queryRunner.query(`DROP TABLE "temporary_link"`);
        await queryRunner.query(`DROP TABLE "link"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "init"`);
    }

}
