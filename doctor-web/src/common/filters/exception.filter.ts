import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as NestExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { IApiError, IApiResponse } from '@common/types';
import { HandleHttpException } from './HttpException';

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: Error, host: ArgumentsHost): Response {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status =
      response.statusCode >= HttpStatus.BAD_REQUEST
        ? response.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let error: IApiError = { code: status, message: 'Internal Server Error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = HandleHttpException(exception);
    }

    const resp: IApiResponse = {
      metadata: {
        timestamp: new Date().toUTCString(),
        path: request.url,
      },
      statusCode: status,
      error,
      data: null,
      message: (HttpStatus[status] || error?.message).replaceAll(/-|_/g, ' '),
      success: false,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception, exception?.stack);
    } else {
      this.logger.warn(exception);
    }

    return response.status(status).json(resp);
  }
}
