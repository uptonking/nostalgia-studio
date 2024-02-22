// This task queue ensures that IDB open calls are done in their own tick
// and sequentially - i.e. we wait for the async IDB open to *fully* complete
// before calling the next one. This works around IE/Edge race conditions in IDB.

import { nextTick } from 'pouchdb-utils';

let running = false;
const queue: { (): void; (): void; new (): any }[] = [];

function tryCode(
  fun: (arg0: any, arg1: any) => void,
  err: any,
  res: any,
  PouchDB: { emit: (arg0: string, arg1: unknown) => void },
) {
  try {
    fun(err, res);
  } catch (err) {
    // Shouldn't happen, but in some odd cases
    // IndexedDB implementations might throw a sync
    // error, in which case this will at least log it.
    PouchDB.emit('error', err);
  }
}

function applyNext(ctx?: any) {
  if (running || !queue.length) {
    return;
  }
  running = true;
  queue.shift()();
}

function enqueueTask(
  action: {
    (thisCallback: any): void;
    (arg0: (err: any, res: any) => void): void;
  },
  callback: any,
  PouchDB: any,
) {
  // @ts-expect-error fix-types
  queue.push(function runAction() {
    action(function runCallback(err: any, res: any) {
      tryCode(callback, err, res, PouchDB);
      running = false;
      nextTick(function runNext() {
        applyNext(PouchDB);
      });
    });
  });
  applyNext();
}

export { enqueueTask };
