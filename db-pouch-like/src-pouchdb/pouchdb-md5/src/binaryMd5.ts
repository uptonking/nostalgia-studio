import crypto from 'crypto';

function binaryMd5(data: string, callback: (arg0: string) => void) {
  const base64 = crypto
    .createHash('md5')
    .update(data, 'binary')
    .digest('base64');

  callback(base64);
}

export default binaryMd5;
