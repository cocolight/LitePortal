
import { HttpStatus, HttpException } from '@nestjs/common';

/**
 * API错误数据传输对象(DTO)
 * 用于规范化和统一API错误响应的格式
 */
export class ApiErrorDto {
    success: false;
    code: number;
    message: string;
    error: string;
    traceId?: string;
    details?: Array<{ field: string; message: string }>;

    constructor(
        code: number,
        message: string,
        error: string,
        traceId?: string,
        details?: Array<{ field: string; message: string }>,
    ) {
        this.success = false;
        this.code = code;
        this.message = message;
        this.error = error;
        this.traceId = traceId;
        this.details = details;
    }

    static fromException(
        exception: unknown,
        traceId?: string,
    ): ApiErrorDto {
        if (exception instanceof HttpException) {
            const res = exception.getResponse() as any;
            return new ApiErrorDto(
                exception.getStatus(),
                res?.message ?? exception.message,
                res?.error ?? exception.name,
                traceId,
                res?.details, // 业务主动抛出的详情
            );
        }
        // 非 HttpException 统一 500
        return new ApiErrorDto(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Internal Server Error',
            'InternalServerError',
            traceId,
        );
    }
}