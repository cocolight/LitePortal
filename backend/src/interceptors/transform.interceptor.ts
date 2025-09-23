// src/interceptors/transform.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { transformKeysToCamelCase } from '../utils/string.utils';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // 如果数据存在，则转换键名为驼峰命名
        return data ? this.transformResponse(data) : data;
      })
    );
  }

  private transformResponse(data: any): any {
    // 可以根据需要添加更复杂的转换逻辑
    return transformKeysToCamelCase(data);
  }
}