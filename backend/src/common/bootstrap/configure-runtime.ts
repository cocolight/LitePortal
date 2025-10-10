#!/usr/bin/env ts-node
/**
 * @文件    : configure-runtime.ts
 * @时间    : 2025/09/29 10:00:35
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    : 运行时配置：CORS、请求体大小、静态资源、日志中间件
 */

// 内置模块
import { join, resolve } from 'path';
// 三方包
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
// 本地模块


/**
 * 配置 NestJS 运行时环境
 * @param app NestExpressApplication 实例
 * @param configService 配置服务实例
 */
export function configureRuntime(
  app: NestExpressApplication,
  configService: ConfigService,
): void {

  // 从配置服务中获取环境变量，设置默认值
  const nodeEnv = configService.get<string>('nodeEnv', 'development'); // 获取当前运行环境，默认为 development
  const logLevel = configService.get<string>('logLevel', 'info'); // 获取日志级别，默认为 info
  const maxBodySize = configService.get<string>('maxBodySize', '10mb'); // 获取请求体大小限制，默认为 10mb
  // const webRoot = configService.get<string>('webRoot')!;
  const webRoot = configService.get<string>('webRoot')
  ? resolve(configService.get<string>('webRoot')!)   // 物理磁盘（留给用户自定义）
  : join(__dirname, 'web');                         // ✅ 优先用虚拟文件系统

  // 0. 开发日志, 在静态文件之后注册，静态文件会短路请求
  if (logLevel === 'debug') {
    app.use((req: express.Request, _: express.Response, next: express.NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  // 1. CORS
  app.enableCors();

  // 2. 请求体大小
  app.use(express.json({ limit: maxBodySize }));

  // 3. 静态文件（仅生产）
  if (nodeEnv === 'production') {
    app.useStaticAssets(webRoot);

    app.use('*', (_req: express.Request, res: express.Response) => {
      res.sendFile(join(webRoot, 'index.html'));
    })
  }


}