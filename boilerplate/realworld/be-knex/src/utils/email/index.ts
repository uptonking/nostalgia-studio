import nodemailer, {
  type SendMailOptions,
  type SentMessageInfo,
} from 'nodemailer';

import type { EmailOptions } from '../../types';
import { env } from '../env-helper';

const transporter = nodemailer.createTransport({
  host: env.string('email.host', 'smtp.gmail.com', true),
  port: env.number('email.port', 587, true),
  auth: {
    user: env.string('EMAIL_USER'),
    pass: env.string('EMAIL_PASS'),
  },
});

export const sendMail = (options: EmailOptions): Promise<SentMessageInfo> => {
  const config: SendMailOptions = {
    from: env.string('EMAIL_USER', 'saxenadhruv1927@gmail.com'),
    ...options,
  };

  return transporter.sendMail(config);
};
