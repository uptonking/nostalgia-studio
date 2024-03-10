import Ajv from 'ajv';
import type { NextFunction, Request, Response } from 'express';
import isEmpty from 'lodash/isEmpty';

import { ApiError } from '../../utils/error-handler';
import { buildErrorObject } from './util';

const ajv = new Ajv();

export const updateValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (isEmpty(req.body)) return next(ApiError.emptyBody());
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      image: { type: 'string' },
    },

    additionalProperties: false,
  };
  const validate = ajv.compile(schema);

  const valid = validate(req.body);

  if (valid) {
    next();
  } else {
    next(buildErrorObject(validate.errors));
  }
};
