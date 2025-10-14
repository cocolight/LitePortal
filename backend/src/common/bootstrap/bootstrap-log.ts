#!/usr/bin/env ts-node
/**
 * @文件    : bootstrap-log.ts
 * @时间    : 2025/09/29 10:02:33
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    : 打印启动信息
 */

// 内置模块

// 三方包
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
// 本地模块


/**
 * 打印应用启动日志
 * @param app NestExpressApplication实例，用于获取配置服务
 */
export function printBootstrapLog(app: NestExpressApplication): void {
  // 从应用实例中获取配置服务
  const configService = app.get(ConfigService);
  // 获取端口号配置，如果未设置则默认为3000
  const port = configService.get<number>('port') ;
  // 获取节点环境配置，如果未设置则默认为development
  const nodeEnv = configService.get<string>('nodeEnv') ;
  // 获取数据库路径配置
  const dbPath = configService.get<string>('dbPath');

  // 判断是否为生产环境
  const isProd = nodeEnv === 'production';

  // 简单彩色
  const reset = '\x1b[0m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const blue = '\x1b[36m';

  console.log();
  console.log(`${green}🚀  LitePortal ${isProd ? '生产' : '开发'}环境启动成功${reset}`);
  console.log(`${blue}✅ 服务运行于${reset} ${yellow}http://localhost:${port}${reset}`);
  console.log(`${blue}📦 数据库路径${reset} ${yellow}${dbPath}${reset}`);
  if (!isProd) {
    console.log(`${blue}📄 API 文档${reset} ${yellow}http://localhost:${port}/api${reset}`);
    console.log(`${blue}📄 离线 JSON${reset} ${yellow}http://localhost:${port}/api-json${reset}`);
  }
  console.log();
}