#!/usr/bin/env ts-node
/**
 * @文件    : api-response.dto.ts
 * @时间    : 2025/09/29 10:27:55
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    :
 */

// 内置模块

// 三方包

// 本地模块


/**
 * 成功响应
 * 通用API响应数据传输对象(DTO)类
 * 使用泛型<T>来支持不同类型的数据响应
 */
export class ApiResponseDto<T = any> {
  success: true;
  code: number;
  message: string;
  data: T;

  constructor(code: number, message: string, data: T) {
    this.success = true;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<D>(data: D, message = 'success'): ApiResponseDto<D> {
    return new ApiResponseDto(200, message, data);
  }
}
