import { createError, DOC_VALIDATION, INVALID_REV } from 'pouchdb-errors';
import { invalidIdError, rev, uuid } from 'pouchdb-utils';

function toObject(array) {
  return array.reduce(function (obj, item) {
    obj[item] = true;
    return obj;
  }, {});
}
// List of top level reserved words for doc
const reservedWords = toObject([
  '_id',
  '_rev',
  '_access',
  '_attachments',
  '_deleted',
  '_revisions',
  '_revs_info',
  '_conflicts',
  '_deleted_conflicts',
  '_local_seq',
  '_rev_tree',
  // replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats',
  // Specific to Couchbase Sync Gateway
  '_removed',
]);

// List of reserved words that should end up in the document
const dataWords = toObject([
  '_access',
  '_attachments',
  // replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats',
]);

function parseRevisionInfo(rev) {
  if (!/^\d+-/.test(rev)) {
    return createError(INVALID_REV);
  }
  const idx = rev.indexOf('-');
  const left = rev.substring(0, idx);
  const right = rev.substring(idx + 1);
  return {
    prefix: parseInt(left, 10),
    id: right,
  };
}

function makeRevTreeFromRevisions(revisions, opts) {
  const pos = revisions.start - revisions.ids.length + 1;

  const revisionIds = revisions.ids;
  let ids = [revisionIds[0], opts, []];

  for (let i = 1, len = revisionIds.length; i < len; i++) {
    ids = [revisionIds[i], { status: 'missing' }, [ids]];
  }

  return [
    {
      pos,
      ids,
    },
  ];
}

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
function parseDoc(doc, newEdits, dbOpts?) {
  if (!dbOpts) {
    dbOpts = {
      deterministic_revs: true,
    };
  }

  let nRevNum;
  let newRevId;
  let revInfo;
  const opts: Record<string, any> = { status: 'available' };
  if (doc._deleted) {
    opts.deleted = true;
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = uuid();
    }
    newRevId = rev(doc, dbOpts.deterministic_revs);
    if (doc._rev) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      doc._rev_tree = [
        {
          pos: revInfo.prefix,
          ids: [revInfo.id, { status: 'missing' }, [[newRevId, opts, []]]],
        },
      ];
      nRevNum = revInfo.prefix + 1;
    } else {
      doc._rev_tree = [
        {
          pos: 1,
          ids: [newRevId, opts, []],
        },
      ];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = makeRevTreeFromRevisions(doc._revisions, opts);
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      nRevNum = revInfo.prefix;
      newRevId = revInfo.id;
      doc._rev_tree = [
        {
          pos: nRevNum,
          ids: [newRevId, opts, []],
        },
      ];
    }
  }

  invalidIdError(doc._id);

  doc._rev = nRevNum + '-' + newRevId;

  const result = { metadata: {}, data: {} };
  for (const key in doc) {
    /* istanbul ignore else */
    if (Object.hasOwn(doc, key)) {
      const specialKey = key[0] === '_';
      if (specialKey && !reservedWords[key]) {
        const error = createError(DOC_VALIDATION, key);
        error.message = DOC_VALIDATION.message + ': ' + key;
        throw error;
      } else if (specialKey && !dataWords[key]) {
        result.metadata[key.slice(1)] = doc[key];
      } else {
        result.data[key] = doc[key];
      }
    }
  }
  return result;
}

export default parseDoc;
