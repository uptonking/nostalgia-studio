import type { DatabaseConfiguration, Fetch, Plugin } from 'pouchdb-types';
import { clone } from 'pouchdb-utils';

import Adapter from './adapter';
import parseAdapter from './parse-adapter';
import TaskQueue from './taskqueue';
import { createClass } from './utils';

// OK, so here's the deal. Consider this code:
//     var db1 = new PouchDB('foo');
//     var db2 = new PouchDB('foo');
//     db1.destroy();
// ^ these two both need to emit 'destroyed' events,
// as well as the PouchDB constructor itself.
// So we have one db object (whichever one got destroy() called on it)
// responsible for emitting the initial event, which then gets emitted
// by the constructor, which then broadcasts it to any other dbs
// that may have been created with the same name.

function prepareForDestruction(self) {
  function onDestroyed(from_constructor) {
    self.removeListener('closed', onClosed);
    if (!from_constructor) {
      self.constructor.emit('destroyed', self.name);
    }
  }

  function onClosed() {
    self.removeListener('destroyed', onDestroyed);
    self.constructor.emit('unref', self);
  }

  self.once('destroyed', onDestroyed);
  self.once('closed', onClosed);
  self.constructor.emit('ref', self);
}

class PouchInternal<PluginProps extends object = {}> extends Adapter {
  static adapters: Record<string, unknown>;
  static preferredAdapters: string[];
  static adapter: (...args: any[]) => void;
  static _destructionListeners: Map<string, Function>;
  static plugin: <PluginSubProps extends object>(
    plugin: Plugin<PluginSubProps>,
    // ) => PouchInternal<PluginProps & PluginSubProps>;
  ) => typeof PouchInternal<PluginSubProps>;
  static __defaults: Record<string, unknown>;
  /**
   * The returned object is a constructor function that works the same as PouchDB,
   * except that whenever you invoke it (e.g. with new), the given options will be passed in by default.
   */
  static defaults: (options: DatabaseConfiguration) => {
    new <Content extends {} = {}>(
      name?: string,
      options?: DatabaseConfiguration,
      //  ): Database<Content> & PluginProps;
    ): any;
  };
  static fetch: Fetch;
  static version: string;

  __opts: DatabaseConfiguration;
  auto_compaction: boolean | undefined;
  purged_infos_limit: number;
  prefix: string;
  name: string;
  _adapter: string;
  taskqueue: TaskQueue;
  static _changesFilterPlugin: any;

  constructor(name?: string, opts?: DatabaseConfiguration) {
    super();
    this._setup(name, opts);
  }

  _setup(name?: string, opts?: DatabaseConfiguration & { [k: string]: any }) {
    super._setup();
    opts = opts || {};

    if (name && typeof name === 'object') {
      opts = name;
      name = opts.name;
      delete opts.name;
    }

    if (opts.deterministic_revs === undefined) {
      opts.deterministic_revs = true;
    }

    this.__opts = opts = clone(opts);

    this.auto_compaction = opts.auto_compaction;
    this.purged_infos_limit = opts.purged_infos_limit || 1000;
    this.prefix = PouchDB.prefix;

    if (typeof name !== 'string') {
      throw new Error('Missing/invalid DB name');
    }

    const prefixedName = (opts.prefix || '') + name;
    const backend = parseAdapter(prefixedName, opts);

    opts.name = backend.name;
    opts.adapter = opts.adapter || backend.adapter;

    this.name = name;
    this._adapter = opts.adapter;
    // @ts-expect-error fix-types 🚨
    PouchDB.emit('debug', ['adapter', 'Picked adapter: ', opts.adapter]);

    if (
      !PouchDB.adapters[opts.adapter] ||
      // @ts-expect-error fix-types
      !PouchDB.adapters[opts.adapter].valid()
    ) {
      throw new Error('Invalid Adapter: ' + opts.adapter);
    }

    if (opts.view_adapter) {
      if (
        !PouchDB.adapters[opts.view_adapter] ||
        // @ts-expect-error fix-types
        !PouchDB.adapters[opts.view_adapter].valid()
      ) {
        throw new Error('Invalid View Adapter: ' + opts.view_adapter);
      }
    }

    this.taskqueue = new TaskQueue();

    this.adapter = opts.adapter;

    // @ts-expect-error fix-types
    PouchDB.adapters[opts.adapter].call(this, opts, (err) => {
      if (err) {
        return this.taskqueue.fail(err);
      }
      prepareForDestruction(this);

      this.emit('created', this);
      // @ts-expect-error fix-types
      PouchDB.emit('created', this.name);
      this.taskqueue.ready(this);
    });
  }
}

// const PouchDB = createClass(PouchInternal, function (name, opts) {
//   PouchInternal.prototype._setup.call(this, name, opts);
// });

export const PouchDB = PouchInternal;
// export class PouchDB<PluginProps extends object = {}> extends PouchInternal {
//   static adapters: Record<string, unknown>;
//   static adapter: (...args: any[]) => void;
//   static _destructionListeners: Map<string, Function>;
// }

export default PouchDB;
