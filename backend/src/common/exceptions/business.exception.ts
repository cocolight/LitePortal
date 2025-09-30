import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常类，继承自HttpException
 * 用于处理业务逻辑上的异常情况
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: number,   // 1000+
    public readonly error: string,  // ICON_NOT_FOUND
    message: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    // HTTP 状态固定 200，内容走 body
    super(
      {
        code,
        message,
        error,
        details,
      },
      HttpStatus.OK,
    );
  }
}