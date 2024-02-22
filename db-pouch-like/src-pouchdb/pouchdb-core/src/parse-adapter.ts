import { guardedConsole, hasLocalStorage } from 'pouchdb-utils';

import PouchDB from './constructor';

export function parseAdapter(name, opts) {
  const match = name.match(/([a-z-]*):\/\/(.*)/);
  if (match) {
    // the http adapter expects the fully qualified name
    return {
      name: /https?/.test(match[1]) ? match[1] + '://' + match[2] : match[2],
      adapter: match[1],
    };
  }

  const adapters = PouchDB.adapters;
  const preferredAdapters = PouchDB.preferredAdapters;
  const prefix = PouchDB.prefix;
  let adapterName = opts.adapter;

  if (!adapterName) {
    // automatically determine adapter
    for (let i = 0; i < preferredAdapters.length; ++i) {
      adapterName = preferredAdapters[i];
      // check for browsers that have been upgraded from websql-only to websql+idb
      /* istanbul ignore if */
      if (
        adapterName === 'idb' &&
        'websql' in adapters &&
        hasLocalStorage() &&
        localStorage['_pouch__websqldb_' + prefix + name]
      ) {
        // log it, because this can be confusing during development
        guardedConsole(
          'log',
          'PouchDB is downgrading "' +
            name +
            '" to WebSQL to' +
            ' avoid data loss, because it was already opened with WebSQL.',
        );
        continue; // keep using websql to avoid user data loss
      }
      break;
    }
  }

  const adapter = adapters[adapterName];

  // if adapter is invalid, then an error will be thrown later
  const usePrefix =
    // @ts-expect-error fix-types
    adapter && 'use_prefix' in adapter ? adapter.use_prefix : true;

  return {
    name: usePrefix ? prefix + name : name,
    adapter: adapterName,
  };
}

export default parseAdapter;
