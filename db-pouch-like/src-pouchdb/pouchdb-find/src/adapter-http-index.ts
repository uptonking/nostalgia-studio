import { generateErrorFromResponse } from 'pouchdb-errors';
import { Headers } from 'pouchdb-fetch';

import massageCreateIndexRequest from './massageCreateIndexRequest';
import validateSelector from './validateSelector';

function dbFetch(db, path, opts, callback) {
  let status;
  let ok;
  opts.headers = new Headers({ 'Content-type': 'application/json' });
  db.fetch(path, opts)
    .then(function (response) {
      status = response.status;
      ok = response.ok;
      return response.json();
    })
    .then(function (json) {
      if (!ok) {
        json.status = status;
        const err = generateErrorFromResponse(json);
        callback(err);
      } else {
        callback(null, json);
      }
    })
    .catch(callback);
}

function createIndex(db, requestDef, callback) {
  requestDef = massageCreateIndexRequest(requestDef);
  dbFetch(
    db,
    '_index',
    {
      method: 'POST',
      body: JSON.stringify(requestDef),
    },
    callback,
  );
}

function find(db, requestDef, callback) {
  validateSelector(requestDef.selector, true);
  dbFetch(
    db,
    '_find',
    {
      method: 'POST',
      body: JSON.stringify(requestDef),
    },
    callback,
  );
}

function explain(db, requestDef, callback) {
  dbFetch(
    db,
    '_explain',
    {
      method: 'POST',
      body: JSON.stringify(requestDef),
    },
    callback,
  );
}

function getIndexes(db, callback) {
  dbFetch(
    db,
    '_index',
    {
      method: 'GET',
    },
    callback,
  );
}

function deleteIndex(db, indexDef, callback) {
  const ddoc = indexDef.ddoc;
  const type = indexDef.type || 'json';
  const name = indexDef.name;

  if (!ddoc) {
    return callback(new Error("you must provide an index's ddoc"));
  }

  if (!name) {
    return callback(new Error("you must provide an index's name"));
  }

  const url = '_index/' + [ddoc, type, name].map(encodeURIComponent).join('/');

  dbFetch(db, url, { method: 'DELETE' }, callback);
}

export { createIndex, find, getIndexes, deleteIndex, explain };
