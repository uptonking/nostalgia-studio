import { Buffer } from 'buffer';

function thisAtob(str: string) {
  const base64 = Buffer.from(str, 'base64');
  // Node.js will just skip the characters it can't decode instead of
  // throwing an exception
  if (base64.toString('base64') !== str) {
    throw new Error('attachment is not a valid base64 string');
  }
  return base64.toString('binary');
}

function thisBtoa(str: string) {
  return Buffer.from(str, 'binary').toString('base64');
}

export { thisAtob as atob, thisBtoa as btoa };
