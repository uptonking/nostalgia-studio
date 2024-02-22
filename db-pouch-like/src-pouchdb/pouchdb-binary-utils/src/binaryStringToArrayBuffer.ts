// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function binaryStringToArrayBuffer(bin) {
  const length = bin.length;
  const buf = new ArrayBuffer(length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
}

export default binaryStringToArrayBuffer;
