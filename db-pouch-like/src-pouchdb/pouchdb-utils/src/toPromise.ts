import clone from './clone';
import once from './once';

function toPromise(func) {
  //create the function we will be returning
  return function (...args) {
    // Clone arguments
    args = clone(args);
    // @ts-expect-error fix-types
    const self = this;
    // if the last argument is a function, assume its a callback
    const usedCB =
      typeof args[args.length - 1] === 'function' ? args.pop() : false;
    const promise = new Promise(function (fulfill, reject) {
      let resp;
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
        resp = func.apply(self, args);
        if (resp && typeof resp.then === 'function') {
          fulfill(resp);
        }
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
    return promise;
  };
}

export default toPromise;
