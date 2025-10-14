import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { resolve, join } from 'path';
import * as fs from 'fs';
import { Init } from './init/init.entity';
import { User } from './modules/users/user.entity';
import { Link } from './modules/links/link.entity';



export async function runMigrations(configService: ConfigService) {

  console.log('full env   :', configService);

  const rootDir = configService.get<string>('rootDir')!;
  const migDir = resolve(rootDir, './migrations');

  const migrations = fs
    .readdirSync(migDir)
    .filter(f => f.endsWith('.js'))
    .map(f => {
      const mod = require(`./migrations/${f}`);
      return Object.values(mod)[0];   // 第一个导出就是类
    })
    .filter(Boolean) as (string | Function)[];


  const dbPath = configService.get('dbPath')
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    synchronize: false,
    entities: [Init, User, Link],
    migrations,
    migrationsRun: false,
  });

  await ds.initialize();
  await ds.runMigrations();
  await ds.destroy();
}