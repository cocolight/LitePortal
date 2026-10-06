-- LitePortal 生产环境表结构（表结构权威来源）。
-- 对齐原 TypeORM 迁移的 up() SQL，启动时由 runSchema 执行一次。

-- 初始化标记表：记录数据是否已写入（幂等种子用）
CREATE TABLE IF NOT EXISTS "init" (
  "key" varchar PRIMARY KEY NOT NULL,
  "value" boolean NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (datetime('now'))
);

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "username" varchar NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT "UQ_user_username" UNIQUE ("username")
);

-- 链接表（核心业务表）
CREATE TABLE IF NOT EXISTS "link" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "link_id" varchar NOT NULL,           -- 业务主键，服务端用 Unix 毫秒生成
  "name" varchar NOT NULL,              -- 链接名称
  "online_icon" varchar,                -- 在线图标 URL
  "text_icon" varchar,                  -- 文字图标
  "upload_icon" varchar,                -- 上传图标 URL
  "paid_icon" varchar,                  -- 付费图标 URL
  "icon_type" varchar NOT NULL DEFAULT ('online_icon'), -- 图标类型，默认 online_icon
  "int_url" varchar,                    -- 内网地址
  "ext_url" varchar,                    -- 外网地址
  "desc" varchar,                       -- 描述
  "created_at" datetime NOT NULL DEFAULT (datetime('now')),
  "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
  "deleted_at" datetime,                -- 软删标记，非空即已删除
  "userId" integer,                     -- 归属用户，对应 user.id（注意是 userId 非 user_id）
  CONSTRAINT "UQ_link_link_id" UNIQUE ("link_id"),
  CONSTRAINT "FK_link_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
