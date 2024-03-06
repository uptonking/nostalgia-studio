import type { NextFunction, Request, Response } from 'express';
import type { Schema } from 'joi';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error == null) {
      next();
    } else {
      const { details, message } = error;
      const messages = details.map((i) => i.message).join(',');

      console.error('validation error', messages);
      res.status(400).json({ error: messages, msg: message });
    }
  };
};
export default validateRequest;
