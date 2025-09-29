import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';
import { ApiErrorDto } from '../dto/api-error.dto';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 统一响应拦截器
 * 正常数据 → ApiResponseDto
 * 业务异常（BusinessException）→ ApiErrorDto（HTTP 200）
 * 其余异常 → 继续抛出，交给全局过滤器（HTTP 非 200）
 */
@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T> | ApiErrorDto>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T> | ApiErrorDto> {
    return next.handle().pipe(
      // 1. 成功：包装成统一成功格式
      map((data) => ApiResponseDto.success(data)),

      // 2. 业务异常：HTTP 200，body 走 ApiErrorDto
      catchError((err) => {
        if (err instanceof BusinessException) {
          const traceId = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;
          // 直接返回 DTO，不再抛 HTTP 异常
          return throwError(() => ApiErrorDto.fromException(err, traceId));
        }
        // 其余（4xx/5xx）→ 继续抛，让过滤器处理
        return throwError(() => err);
      }),
    );
  }
}