/** this is essentially the "update sugar" function from daleharvey/pouchdb#1388
 * the diffFun tells us what delta to apply to the doc.  it either returns
 * the doc, or false if it doesn't need to do an update after all
 */
function upsert(db, docId, diffFun) {
  return db
    .get(docId)
    .catch(function (err) {
      /* istanbul ignore next */
      if (err.status !== 404) {
        throw err;
      }
      return {};
    })
    .then(function (doc) {
      // the user might change the _rev, so save it for posterity
      const docRev = doc._rev;
      const newDoc = diffFun(doc);

      if (!newDoc) {
        // if the diffFun returns falsy, we short-circuit as
        // an optimization
        return { updated: false, rev: docRev };
      }

      // users aren't allowed to modify these values,
      // so reset them here
      newDoc._id = docId;
      newDoc._rev = docRev;
      return tryAndPut(db, newDoc, diffFun);
    });
}

function tryAndPut(db, doc, diffFun) {
  return db.put(doc).then(
    function (res) {
      return {
        updated: true,
        rev: res.rev,
      };
    },
    function (err) {
      /* istanbul ignore next */
      if (err.status !== 409) {
        throw err;
      }
      return upsert(db, doc._id, diffFun);
    },
  );
}

export default upsert;
