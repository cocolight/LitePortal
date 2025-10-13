import { DataSource } from 'typeorm';
import { Init } from './src/init/init.entity';
import { User } from './src/modules/users/user.entity';
import { Link } from './src/modules/links/link.entity';
import * as path from 'path';
const cliDb = path.join(__dirname, 'data/migrate-tmp.db');

export default new DataSource({
  type: 'better-sqlite3',
  database: cliDb,
  entities: [Init, User, Link],   // 必须，CLI 要靠它们做对比
  migrations: ['migrations/*.ts'],
  synchronize: false, // 必须 false，否则 CLI 拒绝生成
  logging: false,
});