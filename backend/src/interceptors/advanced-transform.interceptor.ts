// src/interceptors/advanced-transform.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { transformKeysToCamelCase, snakeToCamel } from '../utils/string.utils';

export interface TransformOptions {
  // 是否启用转换
  enable: boolean;
  // 排除的字段（不转换）
  exclude?: string[];
  // 自定义转换规则
  customTransforms?: {
    [key: string]: (value: any) => any;
  };
}

@Injectable()
export class AdvancedTransformInterceptor implements NestInterceptor {
  constructor(private readonly options: TransformOptions = { enable: true }) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 检查是否应该跳过转换
    const request = context.switchToHttp().getRequest();
    if (this.shouldSkipTransform(request)) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        if (!this.options.enable || !data) {
          return data;
        }
        return this.transformResponse(data);
      })
    );
  }

  private shouldSkipTransform(request: any): boolean {
    // 可以根据请求路径、方法等决定是否跳过转换
    const skipPaths = ['/health', '/metrics'];
    return skipPaths.some(path => request.url.startsWith(path));
  }

  private transformResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformItem(item));
    }
    return this.transformItem(data);
  }

  private transformItem(item: any): any {
    if (item !== null && typeof item === 'object') {
      const transformed: any = {};

      for (const key of Object.keys(item)) {
        // 检查是否在排除列表中
        if (this.options.exclude?.includes(key)) {
          transformed[key] = item[key];
          continue;
        }

        const camelKey = snakeToCamel(key);
        let value = item[key];

        // 递归转换嵌套对象
        if (value !== null && typeof value === 'object') {
          value = this.transformResponse(value);
        }

        // 应用自定义转换
        if (this.options.customTransforms?.[camelKey]) {
          value = this.options.customTransforms[camelKey](value);
        }

        transformed[camelKey] = value;
      }

      return transformed;
    }

    return item;
  }
}