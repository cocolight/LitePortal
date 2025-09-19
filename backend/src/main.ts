import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import express from 'express';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 配置 CORS
  app.enableCors();

  // 配置请求体大小限制
  app.use(express.json({ limit: configService.get<string>('maxBodySize') }));

  // 确保数据库目录存在
  const dbPath = configService.get('dbPath');
  let dbDir;

  if (process.env.NODE_ENV === 'development' && !dbPath.includes('://')) {
    // 开发环境，确保src/data目录存在
    dbDir = join(__dirname, 'data');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
  } else {
    // 生产环境或其他情况，使用数据库路径的目录
    dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
  }

  // 配置静态文件服务（仅在生产环境中使用打包后的前端文件）
  if (configService.get('nodeEnv') === 'production') {
    app.useStaticAssets(join(__dirname, '../web'));
  }

  // 配置日志级别
  if (configService.get('logLevel') === 'debug') {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  const port = configService.get<number>('port');
  const nodeEnv = configService.get<string>('nodeEnv');
  const envName = nodeEnv === 'development' ? '开发环境' : '生产环境';

  await app.listen(port);
  console.log(`✅ NestJS backend running at http://localhost:${port} (${envName})`);
  console.log(`数据库路径: ${configService.get('dbPath')}`);

  // 初始化数据（如果有需要）
  const initDataService = app.get('InitDataService');
  if (configService.get('initTestData')) {
    await initDataService.initTestData();
  }
}
bootstrap();
