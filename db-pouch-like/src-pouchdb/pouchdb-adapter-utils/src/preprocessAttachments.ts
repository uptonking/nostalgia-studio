import {
  atob,
  binaryStringToBlobOrBuffer as binStringToBlobOrBuffer,
  blobOrBufferToBase64 as blufferToBase64,
  blobOrBufferToBinaryString as blufferToBinaryString,
  btoa,
} from 'pouchdb-binary-utils';
import { BAD_ARG, createError } from 'pouchdb-errors';
import { binaryMd5 } from 'pouchdb-md5';

function parseBase64(data) {
  try {
    return atob(data);
  } catch (e) {
    const err = createError(BAD_ARG, 'Attachment is not a valid base64 string');
    return { error: err };
  }
}

function preprocessString(att, blobType, callback) {
  const asBinary = parseBase64(att.data);

  if (typeof asBinary === 'object' && asBinary.error) {
    return callback(asBinary.error);
  }

  if (typeof asBinary === 'string') {
    att.length = asBinary.length;
    if (blobType === 'blob') {
      att.data = binStringToBlobOrBuffer(asBinary, att.content_type);
    } else if (blobType === 'base64') {
      att.data = btoa(asBinary);
    } else {
      // binary
      att.data = asBinary;
    }
    binaryMd5(asBinary, function (result) {
      att.digest = 'md5-' + result;
      callback();
    });
  }
}

function preprocessBlob(att, blobType, callback) {
  binaryMd5(att.data, function (md5) {
    att.digest = 'md5-' + md5;
    // size is for blobs (browser), length is for buffers (node)
    att.length = att.data.size || att.data.length || 0;
    if (blobType === 'binary') {
      blufferToBinaryString(att.data, function (binString) {
        att.data = binString;
        callback();
      });
    } else if (blobType === 'base64') {
      blufferToBase64(att.data, function (b64) {
        att.data = b64;
        callback();
      });
    } else {
      callback();
    }
  });
}

function preprocessAttachment(att, blobType, callback) {
  if (att.stub) {
    return callback();
  }
  if (typeof att.data === 'string') {
    // input is a base64 string
    preprocessString(att, blobType, callback);
  } else {
    // input is a blob
    preprocessBlob(att, blobType, callback);
  }
}

function preprocessAttachments(docInfos, blobType, callback) {
  if (!docInfos.length) {
    return callback();
  }

  let docv = 0;
  let overallErr;

  docInfos.forEach(function (docInfo) {
    const attachments =
      docInfo.data && docInfo.data._attachments
        ? Object.keys(docInfo.data._attachments)
        : [];
    let recv = 0;

    if (!attachments.length) {
      return done();
    }

    function processedAttachment(err) {
      overallErr = err;
      recv++;
      if (recv === attachments.length) {
        done();
      }
    }

    for (const key in docInfo.data._attachments) {
      if (Object.hasOwn(docInfo.data._attachments, key)) {
        preprocessAttachment(
          docInfo.data._attachments[key],
          blobType,
          processedAttachment,
        );
      }
    }
  });

  function done() {
    docv++;
    if (docInfos.length === docv) {
      if (overallErr) {
        callback(overallErr);
      } else {
        callback();
      }
    }
  }
}

export default preprocessAttachments;
