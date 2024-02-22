import { EventEmitter } from 'events';
import { fetch } from 'pouchdb-fetch';

import { ActiveTasks } from './active-tasks';
import PouchDB from './constructor';
import { createClass } from './utils';

PouchDB.adapters = {};
PouchDB.preferredAdapters = [];

PouchDB.prefix = '_pouch_';

const eventEmitter = new EventEmitter();

function setUpEventEmitter(Pouch: typeof PouchDB) {
  Object.keys(EventEmitter.prototype).forEach(function (key) {
    if (typeof EventEmitter.prototype[key] === 'function') {
      Pouch[key] = eventEmitter[key].bind(eventEmitter);
    }
  });

  // these are created in constructor.js, and allow us to notify each DB with
  // the same name that it was destroyed, via the constructor object
  const destructListeners = (Pouch._destructionListeners = new Map());

  // @ts-expect-error fix-types
  Pouch.on('ref', function onConstructorRef(db) {
    if (!destructListeners.has(db.name)) {
      destructListeners.set(db.name, []);
    }
    destructListeners.get(db.name).push(db);
  });

  // @ts-expect-error fix-types
  Pouch.on('unref', function onConstructorUnref(db) {
    if (!destructListeners.has(db.name)) {
      return;
    }
    const dbList = destructListeners.get(db.name);
    const pos = dbList.indexOf(db);
    if (pos < 0) {
      /* istanbul ignore next */
      return;
    }
    dbList.splice(pos, 1);
    if (dbList.length > 1) {
      /* istanbul ignore next */
      destructListeners.set(db.name, dbList);
    } else {
      destructListeners.delete(db.name);
    }
  });

  // @ts-expect-error fix-types
  Pouch.on('destroyed', function onConstructorDestroyed(name) {
    if (!destructListeners.has(name)) {
      return;
    }
    const dbList = destructListeners.get(name);
    destructListeners.delete(name);
    dbList.forEach((db: EventEmitter) => {
      db.emit('destroyed', true);
    });
  });
}

setUpEventEmitter(PouchDB);

PouchDB.adapter = function (id, obj, addToPreferredAdapters) {
  /* istanbul ignore else */
  if (obj.valid()) {
    PouchDB.adapters[id] = obj;
    if (addToPreferredAdapters) {
      PouchDB.preferredAdapters.push(id);
    }
  }
};

// @ts-expect-error fix-types
PouchDB.plugin = function (obj) {
  if (typeof obj === 'function') {
    // function style for plugins
    // @ts-expect-error fix-types
    obj(PouchDB);
  } else if (typeof obj !== 'object' || Object.keys(obj).length === 0) {
    throw new Error(
      'Invalid plugin: got "' + obj + '", expected an object or a function',
    );
  } else {
    Object.keys(obj).forEach(function (id) {
      // object style for plugins
      PouchDB.prototype[id] = obj[id];
    });
  }
  if (this.__defaults) {
    PouchDB.__defaults = { ...this.__defaults };
  }

  return PouchDB;
};

PouchDB.defaults = function (defaultOpts) {
  // @ts-expect-error fix-types
  const PouchWithDefaults = createClass(PouchDB, function (name, opts) {
    opts = opts || {};

    if (name && typeof name === 'object') {
      opts = name;
      name = opts.name;
      delete opts.name;
    }

    opts = { ...PouchWithDefaults.__defaults, ...opts };
    // @ts-expect-error fix-types
    PouchDB.call(this, name, opts);
  }) as typeof PouchDB;

  PouchWithDefaults.preferredAdapters = PouchDB.preferredAdapters.slice();
  Object.keys(PouchDB).forEach(function (key) {
    if (!(key in PouchWithDefaults)) {
      PouchWithDefaults[key] = PouchDB[key];
    }
  });

  // make default options transitive
  // https://github.com/pouchdb/pouchdb/issues/5922
  PouchWithDefaults.__defaults = {
    ...this.__defaults,
    ...defaultOpts,
  };

  return PouchWithDefaults;
};

PouchDB.fetch = function (url, opts) {
  return fetch(url, opts);
};

PouchDB.prototype.activeTasks = PouchDB.activeTasks = new ActiveTasks();

export default PouchDB;
