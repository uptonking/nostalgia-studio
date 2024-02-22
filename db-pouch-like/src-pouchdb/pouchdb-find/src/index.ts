import { isRemote, toPromise } from 'pouchdb-utils';

import * as http from './adapter-http-index';
import * as local from './adapter-local-index';

const plugin: Record<string, any> = {};

plugin.createIndex = toPromise(function (requestDef, callback) {
  if (typeof requestDef !== 'object') {
    return callback(new Error('you must provide an index to create'));
  }

  // @ts-expect-error fix-types
  const createIndex = isRemote(this) ? http.createIndex : local.createIndex;
  // @ts-expect-error fix-types
  createIndex(this, requestDef, callback);
});

plugin.find = toPromise(function (requestDef, callback) {
  if (typeof callback === 'undefined') {
    callback = requestDef;
    requestDef = undefined;
  }

  if (typeof requestDef !== 'object') {
    return callback(new Error('you must provide search parameters to find()'));
  }

  // @ts-expect-error fix-types
  const find = isRemote(this) ? http.find : local.find;
  // @ts-expect-error fix-types
  find(this, requestDef, callback);
});

plugin.explain = toPromise(function (requestDef, callback) {
  if (typeof callback === 'undefined') {
    callback = requestDef;
    requestDef = undefined;
  }

  if (typeof requestDef !== 'object') {
    return callback(
      new Error('you must provide search parameters to explain()'),
    );
  }

  // @ts-expect-error fix-types
  const find = isRemote(this) ? http.explain : local.explain;
  // @ts-expect-error fix-types
  find(this, requestDef, callback);
});

plugin.getIndexes = toPromise(function (callback) {
  // @ts-expect-error fix-types
  const getIndexes = isRemote(this) ? http.getIndexes : local.getIndexes;
  // @ts-expect-error fix-types
  getIndexes(this, callback);
});

plugin.deleteIndex = toPromise(function (indexDef, callback) {
  if (typeof indexDef !== 'object') {
    return callback(new Error('you must provide an index to delete'));
  }

  // @ts-expect-error fix-types
  const deleteIndex = isRemote(this) ? http.deleteIndex : local.deleteIndex;
  // @ts-expect-error fix-types
  deleteIndex(this, indexDef, callback);
});

export default plugin;
