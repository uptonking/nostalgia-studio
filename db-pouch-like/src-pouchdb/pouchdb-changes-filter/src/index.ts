import {
  BAD_REQUEST,
  createError,
  generateErrorFromResponse,
  MISSING_DOC,
} from 'pouchdb-errors';
import { matchesSelector } from 'pouchdb-selector-core';
import {
  isRemote,
  normalizeDdocFunctionName,
  parseDdocFunctionName,
} from 'pouchdb-utils';

import evalFilter from './evalFilter';
import evalView from './evalView';

function validate(
  opts: { selector: any; filter: string },
  callback: (arg0?: any) => void,
) {
  if (opts.selector) {
    if (opts.filter && opts.filter !== '_selector') {
      const filterName =
        typeof opts.filter === 'string' ? opts.filter : 'function';
      return callback(
        new Error('selector invalid for filter "' + filterName + '"'),
      );
    }
  }
  callback();
}

function normalize(opts: { view: any; filter: string; selector: any }) {
  if (opts.view && !opts.filter) {
    opts.filter = '_view';
  }

  if (opts.selector && !opts.filter) {
    opts.filter = '_selector';
  }

  if (opts.filter && typeof opts.filter === 'string') {
    if (opts.filter === '_view') {
      opts.view = normalizeDdocFunctionName(opts.view);
    } else {
      opts.filter = normalizeDdocFunctionName(opts.filter);
    }
  }
}

function shouldFilter(
  changesHandler: { db: any },
  opts: { filter: any; doc_ids: any },
) {
  return (
    opts.filter &&
    typeof opts.filter === 'string' &&
    !opts.doc_ids &&
    !isRemote(changesHandler.db)
  );
}

function filter(
  changesHandler: {
    db: {
      get: (
        arg0: string,
        arg1: { (err: any, ddoc: any): any; (err: any, ddoc: any): any },
      ) => void;
    };
    isCancelled: any;
    doChanges: (arg0: any) => void;
  },
  opts: { complete: any; filter: string; view: any; selector: any },
) {
  const callback = opts.complete;
  if (opts.filter === '_view') {
    if (!opts.view || typeof opts.view !== 'string') {
      const err = createError(
        BAD_REQUEST,
        '`view` filter parameter not found or invalid.',
      );
      return callback(err);
    }
    // fetch a view from a design doc, make it behave like a filter
    const viewName = parseDdocFunctionName(opts.view);
    changesHandler.db.get(
      '_design/' + viewName[0],
      function (err: any, ddoc: { views: { [x: string]: any[] } }) {
        /* istanbul ignore if */
        if (changesHandler.isCancelled) {
          return callback(null, { status: 'cancelled' });
        }
        /* istanbul ignore next */
        if (err) {
          return callback(generateErrorFromResponse(err));
        }
        const mapFun =
          ddoc &&
          ddoc.views &&
          ddoc.views[viewName[1]] &&
          ddoc.views[viewName[1]].map;
        if (!mapFun) {
          return callback(
            createError(
              MISSING_DOC,
              ddoc.views
                ? 'missing json key: ' + viewName[1]
                : 'missing json key: views',
            ),
          );
        }
        // @ts-expect-error fix-types
        opts.filter = evalView(mapFun);
        changesHandler.doChanges(opts);
      },
    );
  } else if (opts.selector) {
    // @ts-expect-error fix-types
    opts.filter = function (doc: any) {
      return matchesSelector(doc, opts.selector);
    };
    changesHandler.doChanges(opts);
  } else {
    // fetch a filter from a design doc
    const filterName = parseDdocFunctionName(opts.filter);
    changesHandler.db.get(
      '_design/' + filterName[0],
      function (err: any, ddoc: { filters: { [x: string]: any } }) {
        /* istanbul ignore if */
        if (changesHandler.isCancelled) {
          return callback(null, { status: 'cancelled' });
        }
        /* istanbul ignore next */
        if (err) {
          return callback(generateErrorFromResponse(err));
        }
        const filterFun = ddoc && ddoc.filters && ddoc.filters[filterName[1]];
        if (!filterFun) {
          return callback(
            createError(
              MISSING_DOC,
              ddoc && ddoc.filters
                ? 'missing json key: ' + filterName[1]
                : 'missing json key: filters',
            ),
          );
        }
        opts.filter = evalFilter(filterFun);
        changesHandler.doChanges(opts);
      },
    );
  }
}

function applyChangesFilterPlugin(PouchDB: {
  _changesFilterPlugin: {
    validate: (
      opts: { selector: any; filter: string },
      callback: (arg0?: any) => void,
    ) => void;
    normalize: (opts: { view: any; filter: string; selector: any }) => void;
    shouldFilter: (changesHandler: any, opts: any) => boolean;
    filter: (changesHandler: any, opts: any) => any;
  };
}) {
  PouchDB._changesFilterPlugin = {
    validate,
    normalize,
    shouldFilter,
    filter,
  };
}

export default applyChangesFilterPlugin;
