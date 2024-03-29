import { createError, MISSING_DOC, REV_CONFLICT } from 'pouchdb-errors';
import updateDoc from './updateDoc';
import {
  isDeleted,
  isLocalId,
  merge,
  winningRev as calculateWinningRev,
} from 'pouchdb-merge';

function rootIsMissing(docInfo) {
  return docInfo.metadata.rev_tree[0].ids[1].status === 'missing';
}

function processDocs(
  revLimit,
  docInfos,
  api,
  fetchedDocs,
  tx,
  results,
  writeDoc,
  opts,
  overallCallback,
) {
  // Default to 1000 locally
  revLimit = revLimit || 1000;

  function insertDoc(docInfo, resultsIdx, callback) {
    // Cant insert new deleted documents
    const winningRev = calculateWinningRev(docInfo.metadata);
    const deleted = isDeleted(docInfo.metadata, winningRev);
    if ('was_delete' in opts && deleted) {
      results[resultsIdx] = createError(MISSING_DOC, 'deleted');
      return callback();
    }

    // 4712 - detect whether a new document was inserted with a _rev
    const inConflict = newEdits && rootIsMissing(docInfo);

    if (inConflict) {
      const err = createError(REV_CONFLICT);
      results[resultsIdx] = err;
      return callback();
    }

    const delta = deleted ? 0 : 1;

    writeDoc(
      docInfo,
      winningRev,
      deleted,
      deleted,
      false,
      delta,
      resultsIdx,
      callback,
    );
  }

  var newEdits = opts.new_edits;
  const idsToDocs = new Map();

  let docsDone = 0;
  let docsToDo = docInfos.length;

  function checkAllDocsDone() {
    if (++docsDone === docsToDo && overallCallback) {
      overallCallback();
    }
  }

  docInfos.forEach(function (currentDoc, resultsIdx) {
    if (currentDoc._id && isLocalId(currentDoc._id)) {
      const fun = currentDoc._deleted ? '_removeLocal' : '_putLocal';
      api[fun](currentDoc, { ctx: tx }, function (err, res) {
        results[resultsIdx] = err || res;
        checkAllDocsDone();
      });
      return;
    }

    const id = currentDoc.metadata.id;
    if (idsToDocs.has(id)) {
      docsToDo--; // duplicate
      idsToDocs.get(id).push([currentDoc, resultsIdx]);
    } else {
      idsToDocs.set(id, [[currentDoc, resultsIdx]]);
    }
  });

  // in the case of new_edits, the user can provide multiple docs
  // with the same id. these need to be processed sequentially
  idsToDocs.forEach(function (docs, id) {
    let numDone = 0;

    function docWritten() {
      if (++numDone < docs.length) {
        nextDoc();
      } else {
        checkAllDocsDone();
      }
    }
    function nextDoc() {
      const value = docs[numDone];
      const currentDoc = value[0];
      const resultsIdx = value[1];

      if (fetchedDocs.has(id)) {
        updateDoc(
          revLimit,
          fetchedDocs.get(id),
          currentDoc,
          results,
          resultsIdx,
          docWritten,
          writeDoc,
          newEdits,
        );
      } else {
        // Ensure stemming applies to new writes as well
        const merged = merge([], currentDoc.metadata.rev_tree[0], revLimit);
        currentDoc.metadata.rev_tree = merged.tree;
        currentDoc.stemmedRevs = merged.stemmedRevs || [];
        insertDoc(currentDoc, resultsIdx, docWritten);
      }
    }
    nextDoc();
  });
}

export default processDocs;
