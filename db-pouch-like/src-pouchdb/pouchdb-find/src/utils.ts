import {
  getFieldFromDoc,
  parseField,
  setFieldInDoc,
} from 'pouchdb-selector-core';
import { nextTick } from 'pouchdb-utils';

function once(fun) {
  let called = false;
  return function (...args) {
    if (called) {
      console.trace();
      throw new Error('once called  more than once');
    } else {
      called = true;
      // @ts-expect-error fix-types
      fun.apply(this, args);
    }
  };
}

function toPromise(func) {
  //create the function we will be returning
  return function (...args) {
    // @ts-expect-error fix-types
    const self = this;
    const tempCB =
      typeof args[args.length - 1] === 'function' ? args.pop() : false;
    // if the last argument is a function, assume its a callback
    let usedCB;
    if (tempCB) {
      // if it was a callback, create a new callback which calls it,
      // but do so async so we don't trap any errors
      usedCB = function (err, resp) {
        nextTick(function () {
          tempCB(err, resp);
        });
      };
    }
    const promise = new Promise(function (fulfill, reject) {
      try {
        const callback = once(function (err, mesg) {
          if (err) {
            reject(err);
          } else {
            fulfill(mesg);
          }
        });
        // create a callback for this invocation
        // apply the function in the orig context
        args.push(callback);
        func.apply(self, args);
      } catch (e) {
        reject(e);
      }
    });
    // if there is a callback, call it back
    if (usedCB) {
      promise.then(function (result) {
        usedCB(null, result);
      }, usedCB);
    }
    // @ts-expect-error fix-types
    promise.cancel = function () {
      return this;
    };
    return promise;
  };
}

function callbackify(fun) {
  return function (...args) {
    const cb = args.pop();
    // @ts-expect-error fix-types
    const promise = fun.apply(this, args);
    promisedCallback(promise, cb);
    return promise;
  };
}

function promisedCallback(promise, callback) {
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
  return promise;
}

const flatten = function (...args) {
  let res = [];
  for (let i = 0, len = args.length; i < len; i++) {
    const subArr = args[i];
    if (Array.isArray(subArr)) {
      res = res.concat(flatten.apply(null, subArr));
    } else {
      res.push(subArr);
    }
  }
  return res;
};

function mergeObjects(arr) {
  let res = {};
  for (let i = 0, len = arr.length; i < len; i++) {
    res = Object.assign(res, arr[i]);
  }
  return res;
}

// Selects a list of fields defined in dot notation from one doc
// and copies them to a new doc. Like underscore _.pick but supports nesting.
function pick(obj, arr) {
  const res = {};
  for (let i = 0, len = arr.length; i < len; i++) {
    const parsedField = parseField(arr[i]);
    const value = getFieldFromDoc(obj, parsedField);
    if (typeof value !== 'undefined') {
      setFieldInDoc(res, parsedField, value);
    }
  }
  return res;
}

// e.g. ['a'], ['a', 'b'] is true, but ['b'], ['a', 'b'] is false
function oneArrayIsSubArrayOfOther(left, right) {
  for (let i = 0, len = Math.min(left.length, right.length); i < len; i++) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

// e.g.['a', 'b', 'c'], ['a', 'b'] is false
function oneArrayIsStrictSubArrayOfOther(left, right) {
  if (left.length > right.length) {
    return false;
  }

  return oneArrayIsSubArrayOfOther(left, right);
}

// same as above, but treat the left array as an unordered set
// e.g. ['b', 'a'], ['a', 'b', 'c'] is true, but ['c'], ['a', 'b', 'c'] is false
function oneSetIsSubArrayOfOther(left, right) {
  left = left.slice();
  for (let i = 0, len = right.length; i < len; i++) {
    const field = right[i];
    if (!left.length) {
      break;
    }
    const leftIdx = left.indexOf(field);
    if (leftIdx === -1) {
      return false;
    } else {
      left.splice(leftIdx, 1);
    }
  }
  return true;
}

function arrayToObject(arr) {
  const res = {};
  for (let i = 0, len = arr.length; i < len; i++) {
    res[arr[i]] = true;
  }
  return res;
}

function max(arr, fun) {
  let max = null;
  let maxScore = -1;
  for (let i = 0, len = arr.length; i < len; i++) {
    const element = arr[i];
    const score = fun(element);
    if (score > maxScore) {
      maxScore = score;
      max = element;
    }
  }
  return max;
}

function arrayEquals(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0, len = arr1.length; i < len; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function uniq(arr) {
  const obj = {};
  for (let i = 0; i < arr.length; i++) {
    obj['$' + arr[i]] = true;
  }
  return Object.keys(obj).map(function (key) {
    return key.substring(1);
  });
}

export {
  arrayEquals,
  arrayToObject,
  callbackify,
  flatten,
  max,
  mergeObjects,
  once,
  oneArrayIsStrictSubArrayOfOther,
  oneArrayIsSubArrayOfOther,
  oneSetIsSubArrayOfOther,
  pick,
  promisedCallback,
  toPromise,
  uniq,
};
