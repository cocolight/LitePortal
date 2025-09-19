import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, dirname } from 'path';

import express from 'express';
import { AppModule } from './app.module';
import { InitDataService } from './init/init-data.service';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 配置 CORS
  app.enableCors();

  // 配置请求体大小限制
  app.use(express.json({ limit: configService.get<string>('maxBodySize') }));



  // 配置静态文件服务（仅在生产环境中使用打包后的前端文件）
  if (configService.get('nodeEnv') === 'production') {
    app.useStaticAssets(join(__dirname, '../web'));
  }

  // 配置日志级别
  if (configService.get('logLevel') === 'debug') {
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  const port = configService.get<number>('port') ?? 3000;
  const nodeEnv = configService.get<string>('nodeEnv');
  const envName = nodeEnv === 'development' ? '开发环境' : '生产环境';

  await app.listen(port);
  console.log(`✅ NestJS backend running at http://localhost:${port} (${envName})`);
  console.log(`数据库路径: ${configService.get('dbPath')}`);

  // 初始化数据（如果有需要）
  const initService = app.get(InitDataService);
  if (configService.get('initTestData')) {
    await initService.initTestData();
  }
}
bootstrap();
