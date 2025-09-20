import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder} from '@nestjs/swagger'
import { join, dirname } from 'path';

import express from 'express';
import { AppModule } from './app.module';
import { InitDataService } from './init/init-data.service';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 获取环境变量
  const nodeEnv = configService.get<string>('nodeEnv');
  const port = configService.get<number>('port') ?? 3000;
  const logLevel = configService.get<string>('logLevel');
  const envName = nodeEnv === 'development' ? '开发环境' : '生产环境';

  // 配置 CORS
  app.enableCors();

  // 配置请求体大小限制
  app.use(express.json({ limit: configService.get<string>('maxBodySize') }));



  // 配置静态文件服务（仅在生产环境中使用打包后的前端文件）
  if (nodeEnv === 'production') {
    app.useStaticAssets(join(__dirname, '../web'));
  }

  // 配置日志级别
  if (logLevel === 'debug') {
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  // 配置 Swagger 文档
  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('LitePortal 后端 API')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); // 仅 dev/staging 可见
  }

  await app.listen(port);

  // 生产环境和开发环境显示不同的信息
  if (nodeEnv === 'production') {
    console.log(`🚀 LitePortal 生产环境启动成功`);
    console.log(`✅ 服务运行于 http://localhost:${port}`);
    console.log(`📦数据库路径: ${configService.get('dbPath')}`);
    console.log(`🔒 请确保在生产环境中已正确配置安全措施`);
  } else {
    console.log(`🚀 LitePortal 开发环境启动成功`);
    console.log(`✅ 开发服务器运行于 http://localhost:${port}`);
    console.log(`✅ API 文档运行于 http://localhost:${port}/api`);
    console.log(`📦数据库路径: ${configService.get('dbPath')}`);
    console.log(`🛠️  开发模式已启用，热重载已激活`);
  }

  // 初始化数据（如果有需要）
  const initService = app.get(InitDataService);
  if (configService.get('initTestData')) {
    await initService.initTestData();
  }
}
bootstrap();
