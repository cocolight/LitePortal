import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { resolve } from 'path'

// 默认为生产环境
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const nodeEnv = process.env.NODE_ENV

const envFile = `.env.${process.env.NODE_ENV}`

let envFilePath = resolve(__dirname, '..', envFile)
// 生产环境直接使用默认的.env文件
if (nodeEnv === 'development') {
  envFilePath = resolve(__dirname, '..', '..', envFile)
}

console.log(`envFilePath: ${envFilePath}`)
console.log(`NODE_ENV: ${nodeEnv}`)

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [envFilePath, '.env'],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}