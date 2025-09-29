#!/usr/bin/env ts-node
/**
 * @文件    : configure-swagger.ts
 * @时间    : 2025/09/29 10:02:58
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    : 配置 Swagger（仅开发环境）
 */

// 内置模块

// 三方包
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
// 本地模块


/**
 * 配置Swagger API文档
 * @param app NestExpressApplication实例
 * @param configService 配置服务实例
 */
export function configureSwagger(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  // 获取当前运行环境，默认为'development'
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  // 如果不是开发环境，则直接返回，不配置Swagger
  if (nodeEnv !== 'development') return;

  // 创建Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('LitePortal 后端 API') // 设置API标题
    .setDescription('LitePortal 接口文档') // 设置API描述
    .setVersion('1.0') // 设置API版本
    .addBearerAuth() // 添加Bearer认证
    .build(); // 构建配置对象

  // 创建Swagger文档，并设置操作ID生成规则
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey}_${methodKey}`, // 自定义操作ID生成规则
  });

  // 设置Swagger文档的访问路径为'/api'
  SwaggerModule.setup('api', app, document);
  // 以下代码被注释，可能是用于提供离线JSON文档的功能
  // 离线 json
  // app.get('/api-json', (_, res) => res.json(document));
  // app.get('/api-json', (req: express.Request, res: express.Response) => res.json(document));

}