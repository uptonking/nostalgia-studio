import Ajv from 'ajv';
import type { NextFunction, Request, Response } from 'express';
import isEmpty from 'lodash/isEmpty';

import { ApiError } from '../../utils/error-handler';
import { buildErrorObject } from './util';

const ajv = new Ajv();

export const registerValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (isEmpty(req.body.user)) return next(ApiError.emptyBody());
  const schema = {
    type: 'object',
    properties: {
      username: { type: 'string' },
      email: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
      image: { type: 'string' },
    },
    required: ['username', 'email', 'password'],
    additionalProperties: false,
  };
  const validate = ajv.compile(schema);

  const valid = validate(req.body.user);

  if (valid) {
    next();
  } else {
    next(buildErrorObject(validate.errors));
  }
};

export const loginValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (isEmpty(req.body)) return next(ApiError.emptyBody());
  const schema = {
    type: 'object',
    properties: {
      identifier: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['identifier', 'password'],
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
