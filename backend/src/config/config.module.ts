import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { resolve } from 'path'

// 默认为生产环境
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const envFile = `.env.${process.env.NODE_ENV}`
const envFilePath = resolve(__dirname, '../', '../', envFile)

// const fullPath = path.join(__dirname, '..', envFile);
// console.log('[Config] 尝试加载:', fullPath);
// console.log('[Config] 文件存在:', require('fs').existsSync(fullPath));
// console.log('[Config] process.env.NODE_ENV=', process.env.NODE_ENV);

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [envFilePath, envFile, '.env'], // 关键一行
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}