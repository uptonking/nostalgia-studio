import { filterChange, uuid } from 'pouchdb-utils';

import { DOC_STORE, processAttachment } from './util';

export default function (txn, idbChanges, api, dbOpts, opts) {
  if (txn.error) {
    return opts.complete(txn.error);
  }

  if (opts.continuous) {
    var id = dbOpts.name + ':' + uuid();
    idbChanges.addListener(dbOpts.name, id, api, opts);
    idbChanges.notify(dbOpts.name);
    return {
      cancel: function () {
        idbChanges.removeListener(dbOpts.name, id);
      },
    };
  }

  var limit = 'limit' in opts ? opts.limit : -1;
  if (limit === 0) {
    limit = 1;
  }

  var store = txn.txn.objectStore(DOC_STORE).index('seq');

  var filter = filterChange(opts);
  var received = 0;

  var lastSeq = opts.since || 0;
  var results = [];

  var processing = [];

  function onReqSuccess(e) {
    if (!e.target.result) {
      return;
    }
    var cursor = e.target.result;
    var doc = cursor.value;
    // Overwrite doc.data, which may have been rewritten (see rewrite.js) with
    // the clean version for that rev
    doc.data = doc.revs[doc.rev].data;
    doc.data._id = doc.id;
    doc.data._rev = doc.rev;
    if (doc.deleted) {
      doc.data._deleted = true;
    }

    if (opts.doc_ids && opts.doc_ids.indexOf(doc.id) === -1) {
      return cursor.continue();
    }

    // WARNING: expecting possible old format
    var change = opts.processChange(doc.data, doc, opts);
    change.seq = doc.seq;
    lastSeq = doc.seq;
    var filtered = filter(change);

    // If its an error
    if (typeof filtered === 'object') {
      return opts.complete(filtered);
    }

    if (filtered) {
      received++;
      if (opts.return_docs) {
        results.push(change);
      }

      if (opts.include_docs && opts.attachments && doc.data._attachments) {
        var promises = [];
        for (var name in doc.data._attachments) {
          var p = processAttachment(
            name,
            doc,
            change.doc,
            opts.binary,
            api.blobSupport,
          );
          // We add the processing promise to 2 arrays, one tracks all
          // the promises needed before we fire onChange, the other
          // ensure we process all attachments before onComplete
          promises.push(p);
          processing.push(p);
        }

        Promise.all(promises).then(function () {
          opts.onChange(change);
        });
      } else {
        opts.onChange(change);
      }
    }
    if (received !== limit) {
      cursor.continue();
    }
  }

  function onTxnComplete() {
    Promise.all(processing).then(function () {
      opts.complete(null, {
        results,
        last_seq: lastSeq,
      });
    });
  }

  var req;
  if (opts.descending) {
    req = store.openCursor(null, 'prev');
  } else {
    req = store.openCursor(IDBKeyRange.lowerBound(opts.since, true));
  }

  txn.txn.oncomplete = onTxnComplete;
  req.onsuccess = onReqSuccess;
}
