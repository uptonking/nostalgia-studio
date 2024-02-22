import crypto from 'crypto';

function stringMd5(str: string) {
  return crypto.createHash('md5').update(str, 'binary').digest('hex');
}

export default stringMd5;
