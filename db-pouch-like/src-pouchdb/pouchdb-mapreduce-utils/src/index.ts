import { nextTick } from 'pouchdb-utils';

import { BuiltInError, NotFoundError, QueryParseError } from './errors';

function promisedCallback(promise, callback) {
  if (callback) {
    promise.then(
      function (res) {
        nextTick(function () {
          callback(null, res);
        });
      },
      function (reason) {
        nextTick(function () {
          callback(reason);
        });
      },
    );
  }
  return promise;
}

function callbackify(fun) {
  return function (...args) {
    const cb = args.pop();
    // @ts-expect-error fix-types
    const promise = fun.apply(this, args);
    if (typeof cb === 'function') {
      promisedCallback(promise, cb);
    }
    return promise;
  };
}

// Promise finally util similar to Q.finally
function fin(promise, finalPromiseFactory) {
  return promise.then(
    function (res) {
      return finalPromiseFactory().then(function () {
        return res;
      });
    },
    function (reason) {
      return finalPromiseFactory().then(function () {
        throw reason;
      });
    },
  );
}

function sequentialize(queue, promiseFactory) {
  return function () {
    const args = arguments;
    // @ts-expect-error fix-types
    const that = this;
    return queue.add(function () {
      return promiseFactory.apply(that, args);
    });
  };
}

// uniq an array of strings, order not guaranteed
// similar to underscore/lodash _.uniq
function uniq(arr) {
  const theSet = new Set(arr);
  const result = new Array(theSet.size);
  let index = -1;
  theSet.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

function mapToKeysArray(map) {
  const result = new Array(map.size);
  let index = -1;
  map.forEach(function (value, key) {
    result[++index] = key;
  });
  return result;
}

export {
  uniq,
  sequentialize,
  fin,
  callbackify,
  promisedCallback,
  mapToKeysArray,
  QueryParseError,
  NotFoundError,
  BuiltInError,
};
