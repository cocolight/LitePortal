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

/* 2. 判断并给出明确提示 */
import { readFileSync } from 'fs';
if (!require('fs').existsSync(envFilePath)) {
  console.warn(`[Config] ❌ 未找到 ${envFilePath}，将完全依赖环境变量`);
} else {
  console.log(`[Config] ✅ 正在加载 ${envFilePath}`);
  // 可选：把前 5 行打出来（不含敏感 key）
  const head = readFileSync(envFilePath, 'utf8')
    .split('\n')
    .slice(0, 5)
    .join('\n');
  console.log('[Config] 文件头 5 行：\n' + head);
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