import { traverseRevTree } from 'pouchdb-merge';

import { DOC_STORE } from './util';

export default function (txn, id, revs, callback) {
  if (txn.error) {
    return callback(txn.error);
  }

  var docStore = txn.txn.objectStore(DOC_STORE);

  docStore.get(id).onsuccess = function (e) {
    var doc = e.target.result;

    traverseRevTree(doc.rev_tree, function (isLeaf, pos, revHash, ctx, opts) {
      var rev = pos + '-' + revHash;
      if (revs.indexOf(rev) !== -1) {
        opts.status = 'missing';
      }
    });

    var attachments = [];

    revs.forEach(function (rev) {
      if (rev in doc.revs) {
        // Make a list of attachments that are used by the revisions being
        // deleted
        if (doc.revs[rev].data._attachments) {
          for (var k in doc.revs[rev].data._attachments) {
            attachments.push(doc.revs[rev].data._attachments[k].digest);
          }
        }
        delete doc.revs[rev];
      }
    });

    // Attachments have a list of revisions that are using them, when
    // that list becomes empty we can delete the attachment.
    attachments.forEach(function (digest) {
      revs.forEach(function (rev) {
        delete doc.attachments[digest].revs[rev];
      });
      if (!Object.keys(doc.attachments[digest].revs).length) {
        delete doc.attachments[digest];
      }
    });

    docStore.put(doc);
  };

  txn.txn.oncomplete = function () {
    callback();
  };
}
