import { btoa, readAsArrayBuffer } from 'pouchdb-binary-utils';
import Md5 from 'spark-md5';

const setImmediateShim = self.setImmediate || self.setTimeout;
const MD5_CHUNK_SIZE = 32768;

function rawToBase64(raw) {
  return btoa(raw);
}

function sliceBlob(blob, start, end) {
  if (blob.webkitSlice) {
    return blob.webkitSlice(start, end);
  }
  return blob.slice(start, end);
}

function appendBlob(buffer, blob, start, end, callback) {
  if (start > 0 || end < blob.size) {
    // only slice blob if we really need to
    blob = sliceBlob(blob, start, end);
  }
  readAsArrayBuffer(blob, function (arrayBuffer) {
    buffer.append(arrayBuffer);
    callback();
  });
}

function appendString(buffer, string, start, end, callback) {
  if (start > 0 || end < string.length) {
    // only create a substring if we really need to
    string = string.substring(start, end);
  }
  buffer.appendBinary(string);
  callback();
}

function binaryMd5(data, callback) {
  const inputIsString = typeof data === 'string';
  const len = inputIsString ? data.length : data.size;
  const chunkSize = Math.min(MD5_CHUNK_SIZE, len);
  const chunks = Math.ceil(len / chunkSize);
  let currentChunk = 0;
  const buffer = inputIsString ? new Md5() : new Md5.ArrayBuffer();

  const append = inputIsString ? appendString : appendBlob;

  function next() {
    setImmediateShim(loadNextChunk);
  }

  function done() {
    const raw = buffer.end(true);
    const base64 = rawToBase64(raw);
    callback(base64);
    buffer.destroy();
  }

  function loadNextChunk() {
    const start = currentChunk * chunkSize;
    const end = start + chunkSize;
    currentChunk++;
    if (currentChunk < chunks) {
      append(buffer, data, start, end, next);
    } else {
      append(buffer, data, start, end, done);
    }
  }
  loadNextChunk();
}

export default binaryMd5;
