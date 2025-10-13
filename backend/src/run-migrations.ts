import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Init } from './init/init.entity';
import { User } from './modules/users/user.entity';
import { Link } from './modules/links/link.entity';


const migrations = fs
  .readdirSync(path.join(__dirname, './migrations'))
  .filter(f => f.endsWith('.js'))
  .map(f => {
    const mod = require(path.join(__dirname, './migrations', f));
    return Object.values(mod)[0];   // 第一个导出就是类
  })
  .filter(Boolean) as (string | Function)[];

export async function runMigrations() {
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH ?? './data/database.sqlite',
    synchronize: false,
    entities: [Init, User, Link],
    migrations,
    migrationsRun: false,
  });

  await ds.initialize();
  await ds.runMigrations();
  await ds.destroy();
}