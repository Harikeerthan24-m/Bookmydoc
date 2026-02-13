import { HttpException } from '@nestjs/common';

import { IApiError, IUnsafeObject } from '@common/types';

export function HandleHttpException(exception: HttpException): IApiError {
  const exceptionResp = exception.getResponse() as IUnsafeObject | string;
  const message =
    typeof exceptionResp === 'string'
      ? exceptionResp
      : (exceptionResp?.message as string);

  const extra = exception?.cause as IUnsafeObject | string;

  return { code: exception.getStatus(), message, extra };
}
