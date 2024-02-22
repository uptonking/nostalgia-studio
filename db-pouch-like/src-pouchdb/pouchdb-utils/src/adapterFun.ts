import toPromise from './toPromise';

function logApiCall(self: any, name: string, args: any) {
  /* istanbul ignore if */
  if (self.constructor.listeners('debug').length) {
    const logArgs = ['api', self.name, name];
    for (let i = 0; i < args.length - 1; i++) {
      logArgs.push(args[i]);
    }
    self.constructor.emit('debug', logArgs);

    // override the callback itself to log the response
    const origCallback = args[args.length - 1];
    args[args.length - 1] = function (err: any, res: any) {
      let responseArgs = ['api', self.name, name];
      responseArgs = responseArgs.concat(
        err ? ['error', err] : ['success', res],
      );
      self.constructor.emit('debug', responseArgs);
      origCallback(err, res);
    };
  }
}

/** convert function from callback style to promise style */
function adapterFun(
  name: string,
  callback: { apply: (arg0: any, arg1: any[]) => any },
) {
  return toPromise(function (this: any, ...args: any[]) {
    if (this._closed) {
      return Promise.reject(new Error('database is closed'));
    }
    if (this._destroyed) {
      return Promise.reject(new Error('database is destroyed'));
    }
    const self = this;
    logApiCall(self, name, args);
    if (!this.taskqueue.isReady) {
      return new Promise(function (fulfill, reject) {
        self.taskqueue.addTask((failed: boolean) => {
          if (failed) {
            reject(failed);
          } else {
            fulfill(self[name].apply(self, args));
          }
        });
      });
    }
    return callback.apply(this, args);
  });
}

export default adapterFun;
