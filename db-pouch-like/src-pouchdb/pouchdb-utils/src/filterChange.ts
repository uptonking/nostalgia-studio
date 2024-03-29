import { BAD_REQUEST, createError } from 'pouchdb-errors';

function tryFilter(filter, doc, req) {
  try {
    return !filter(doc, req);
  } catch (err) {
    const msg = 'Filter function threw: ' + err.toString();
    return createError(BAD_REQUEST, msg);
  }
}

function filterChange(opts) {
  const req: Record<string, any> = {};
  const hasFilter = opts.filter && typeof opts.filter === 'function';
  req.query = opts.query_params;

  return function filter(change) {
    if (!change.doc) {
      // CSG sends events on the changes feed that don't have documents,
      // this hack makes a whole lot of existing code robust.
      change.doc = {};
    }

    const filterReturn = hasFilter && tryFilter(opts.filter, change.doc, req);

    if (typeof filterReturn === 'object') {
      return filterReturn;
    }

    if (filterReturn) {
      return false;
    }

    if (!opts.include_docs) {
      delete change.doc;
    } else if (!opts.attachments) {
      for (const att in change.doc._attachments) {
        /* istanbul ignore else */
        if (Object.hasOwn(change.doc._attachments, att)) {
          change.doc._attachments[att].stub = true;
        }
      }
    }
    return true;
  };
}

export default filterChange;
