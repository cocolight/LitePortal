#!/usr/bin/env ts-node
/**
 * @文件    : main-next.ts
 * @时间    : 2025/09/29 10:09:32
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    :
 */

// 内置模块

// 三方包
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
// 本地模块
import { AppModule } from './app.module';
import { InitDataService } from './init/init-data.service';
import { runMigrations } from './run-migrations';
import {
  configureRuntime,
  configureSwagger,
  configureGlobal,
  printBootstrapLog,
} from './common/bootstrap';

/**
 * NestJS 应用引导函数
 * 用于创建、配置和启动 NestJS 应用
 */
async function bootstrap() {
  // 创建 NestExpressApplication 实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取 ConfigService 实例，用于访问配置项
  const configService = app.get(ConfigService);

  // 配置运行时参数，包括中间件、全局设置等
  configureRuntime(app, configService);
  // 配置 Swagger API 文档
  configureSwagger(app, configService);

  // ② 全局洋葱
  configureGlobal(app);

  // ③ 启动
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  printBootstrapLog(app);

  // ④ 初始化数据
  const initService = app.get(InitDataService);
  const nodeEnv = configService.get<string>('nodeEnv')
  if (nodeEnv === 'development') {
    if (configService.get('initData')) await initService.initTestData();
  } else if (nodeEnv === 'production') {
    await runMigrations(); // 迁移数据
    if (configService.get('initData')) await initService.initProdData();
  }



}

bootstrap();