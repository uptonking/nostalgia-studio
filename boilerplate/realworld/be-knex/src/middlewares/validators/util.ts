import type { ErrorObject } from 'ajv';

import { ApiError } from '../../utils/error-handler';

export const buildErrorObject = (
  err: ErrorObject[] | null | undefined,
): ApiError => {
  if (err) {
    const { message }: ErrorObject = err[0];
    return ApiError.badRequest({
      message: message || '',
      type: 'validationError',
    });
  } else {
    return ApiError.internalError();
  }
};
