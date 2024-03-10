import type { SendMailOptions } from 'nodemailer';

export type EmailOptions = Omit<SendMailOptions, 'from'>;
