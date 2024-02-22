import { EventEmitter } from 'events';

import hasLocalStorage from './env/hasLocalStorage';
import nextTick from './nextTick';
import pick from './pick';

export default class Changes extends EventEmitter {
  _listeners: Record<string, (...args: any[]) => void>;

  constructor() {
    super();

    this._listeners = {};

    if (hasLocalStorage()) {
      addEventListener('storage', (e) => {
        this.emit(e.key);
      });
    }
  }

  // @ts-expect-error fix-types
  addListener(dbName, id, db, opts) {
    if (this._listeners[id]) {
      return;
    }
    let inprogress: boolean | string = false;
    const self = this;
    function eventFunction() {
      if (!self._listeners[id]) {
        return;
      }
      if (inprogress) {
        inprogress = 'waiting';
        return;
      }
      inprogress = true;
      const changesOpts = pick(opts, [
        'style',
        'include_docs',
        'attachments',
        'conflicts',
        'filter',
        'doc_ids',
        'view',
        'since',
        'query_params',
        'binary',
        'return_docs',
      ]);

      function onError() {
        inprogress = false;
      }

      db.changes(changesOpts)
        .on('change', function (c) {
          if (c.seq > opts.since && !opts.cancelled) {
            opts.since = c.seq;
            opts.onChange(c);
          }
        })
        .on('complete', function () {
          if (inprogress === 'waiting') {
            nextTick(eventFunction);
          }
          inprogress = false;
        })
        .on('error', onError);
    }
    this._listeners[id] = eventFunction;
    this.on(dbName, eventFunction);
  }

  // @ts-expect-error fix-types
  removeListener(dbName, id) {
    if (!(id in this._listeners)) {
      return;
    }
    super.removeListener(dbName, this._listeners[id]);
    delete this._listeners[id];
  }

  notifyLocalWindows(dbName) {
    //do a useless change on a storage thing
    //in order to get other windows's listeners to activate
    if (hasLocalStorage()) {
      localStorage[dbName] = localStorage[dbName] === 'a' ? 'b' : 'a';
    }
  }

  notify(dbName) {
    this.emit(dbName);
    this.notifyLocalWindows(dbName);
  }
}
