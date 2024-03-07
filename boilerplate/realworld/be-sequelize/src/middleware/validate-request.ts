import type { NextFunction, Request, Response } from 'express';
import type { Schema } from 'joi';

import { ValidationError } from '../utils/api-error';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // console.log(';; validateReq ', req.body);
    const { error } = schema.validate(req.body.user);

    if (error) {
      next(new ValidationError(error.details.map((i) => i.message).join(',')));
    } else {
      next();
    }

    // if (error == null) {
    //   next();
    // } else {
    //   const { details, message } = error;
    //   const messages = details.map((i) => i.message).join(',');

    //   console.error('validation error', messages);
    //   // res.status(422).json({ error: messages, msg: message });
    //   res.status(422).json({ errors: { body: messages } });
    // }
  };
};
export default validateRequest;
