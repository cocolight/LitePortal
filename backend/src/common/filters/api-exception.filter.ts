#!/usr/bin/env ts-node
/**
 * @文件    : api-exception.filter.ts
 * @时间    : 2025/09/29 10:20:50
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    :
 */

// 内置模块

// 三方包
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost
} from '@nestjs/common';
// 本地模块
import { ApiErrorDto } from '../dto/api-error.dto';

/**
 * 异常过滤器装饰器，用于标记该类为异常过滤器
 */
@Catch()
/**
 * ApiExceptionFilter 类，实现了 ExceptionFilter 接口，用于处理 API 异常
 */
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * 捕获异常的方法
   * @param exception 捕获到的异常对象
   * @param host ArgumentsHost 对象，提供对请求/响应上下文的访问
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // 切换到 HTTP 上下文
    const ctx = host.switchToHttp();
    // 获取响应对象
    const response = ctx.getResponse();
    // 获取请求对象
    // const request = ctx.getRequest();

    // 简单 traceId（生产可用 uuid 或 cls-hooked）
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 2. 统一错误 DTO
    const errorDto = ApiErrorDto.fromException(exception, traceId);

    // 3. 返回
    response.status(errorDto.code).json(errorDto);
  }
}