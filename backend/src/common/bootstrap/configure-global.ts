#!/usr/bin/env ts-node
/**
 * @文件    : configure-global.ts
 * @时间    : 2025/09/29 10:02:05
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    : 注册全局洋葱模型：管道→拦截器→过滤器
 */

// 内置模块

// 三方包
import { BadRequestException, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
// 本地模块
import { ApiResponseInterceptor} from '../interceptors';
import { ApiExceptionFilter } from '../filters/api-exception.filter';
import { Reflector } from '@nestjs/core';


/**
 * 配置全局应用设置
 * @param app NestExpressApplication 应用实例
 */
export function configureGlobal(app: NestExpressApplication): void {
  // 1. 全局管道
  app.useGlobalPipes(
    //验证 & 转换
    new ValidationPipe({
      transform: true,        // 启用自动转换
      whitelist: true,        // 启用白名单过滤
      forbidNonWhitelisted: true,  // 禁止非白名单属性
      exceptionFactory: (errors) => {  // 自定义异常工厂
        const msg = errors
          .map((e) => Object.values(e.constraints || {}).join(';'))  // 合并所有错误信息
          .join(',');  // 用逗号分隔多个错误
        return new BadRequestException(msg || '请求参数校验失败');  // 返回错误信息
      },
    }),
  );

  // 2. 全局响应拦截器, 响应包装
  app.useGlobalInterceptors(
    new ApiResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector),{excludeExtraneousValues: true})
  );

  // 3. 全局异常过滤器, 异常兜底
  app.useGlobalFilters(new ApiExceptionFilter());
}