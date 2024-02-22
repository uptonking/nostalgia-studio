/**
 * Simple task queue to sequentialize actions. Assumes
 * callbacks will eventually fire (once).
 */
class TaskQueue {
  promise: Promise<unknown>;

  constructor() {
    this.promise = new Promise(function (fulfill) {
      fulfill(undefined);
    });
  }

  add(promiseFactory) {
    this.promise = this.promise
      .catch(function () {
        // just recover
      })
      .then(function () {
        return promiseFactory();
      });
    return this.promise;
  }

  finish() {
    return this.promise;
  }
}

export default TaskQueue;
