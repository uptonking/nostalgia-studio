import { collate } from 'pouchdb-collate';
import { explainError } from 'pouchdb-utils';

const CHECKPOINT_VERSION = 1;
const REPLICATOR = 'pouchdb';
// This is an arbitrary number to limit the
// amount of replication history we save in the checkpoint.
// If we save too much, the checkpoint docs will become very big,
// if we save fewer, we'll run a greater risk of having to
// read all the changes from 0 when checkpoint PUTs fail
// CouchDB 2.0 has a more involved history pruning,
// but let's go for the simple version for now.
const CHECKPOINT_HISTORY_SIZE = 5;
const LOWEST_SEQ = 0;

function updateCheckpoint(db, id, checkpoint, session, returnValue) {
  return db
    .get(id)
    .catch(function (err) {
      if (err.status === 404) {
        if (db.adapter === 'http' || db.adapter === 'https') {
          explainError(
            404,
            'PouchDB is just checking if a remote checkpoint exists.',
          );
        }
        return {
          session_id: session,
          _id: id,
          history: [],
          replicator: REPLICATOR,
          version: CHECKPOINT_VERSION,
        };
      }
      throw err;
    })
    .then(function (doc) {
      if (returnValue.cancelled) {
        return;
      }

      // if the checkpoint has not changed, do not update
      if (doc.last_seq === checkpoint) {
        return;
      }

      // Filter out current entry for this replication
      doc.history = (doc.history || []).filter(function (item) {
        return item.session_id !== session;
      });

      // Add the latest checkpoint to history
      doc.history.unshift({
        last_seq: checkpoint,
        session_id: session,
      });

      // Just take the last pieces in history, to
      // avoid really big checkpoint docs.
      // see comment on history size above
      doc.history = doc.history.slice(0, CHECKPOINT_HISTORY_SIZE);

      doc.version = CHECKPOINT_VERSION;
      doc.replicator = REPLICATOR;

      doc.session_id = session;
      doc.last_seq = checkpoint;

      return db.put(doc).catch(function (err) {
        if (err.status === 409) {
          // retry; someone is trying to write a checkpoint simultaneously
          return updateCheckpoint(db, id, checkpoint, session, returnValue);
        }
        throw err;
      });
    });
}

class CheckpointerInternal {
  src: any;
  target: any;
  id: any;
  returnValue: any;
  opts: any;

  constructor(src, target, id, returnValue, opts) {
    this.src = src;
    this.target = target;
    this.id = id;
    this.returnValue = returnValue;
    this.opts = opts || {};
  }

  writeCheckpoint(checkpoint, session) {
    const self = this;
    return this.updateTarget(checkpoint, session).then(function () {
      return self.updateSource(checkpoint, session);
    });
  }

  updateTarget(checkpoint, session) {
    if (this.opts.writeTargetCheckpoint) {
      return updateCheckpoint(
        this.target,
        this.id,
        checkpoint,
        session,
        this.returnValue,
      );
    } else {
      return Promise.resolve(true);
    }
  }

  updateSource(checkpoint, session) {
    if (this.opts.writeSourceCheckpoint) {
      const self = this;
      return updateCheckpoint(
        this.src,
        this.id,
        checkpoint,
        session,
        this.returnValue,
      ).catch(function (err) {
        if (isForbiddenError(err)) {
          self.opts.writeSourceCheckpoint = false;
          return true;
        }
        throw err;
      });
    } else {
      return Promise.resolve(true);
    }
  }

  getCheckpoint() {
    const self = this;

    if (
      self.opts &&
      self.opts.writeSourceCheckpoint &&
      !self.opts.writeTargetCheckpoint
    ) {
      return self.src
        .get(self.id)
        .then(function (sourceDoc) {
          return sourceDoc.last_seq || LOWEST_SEQ;
        })
        .catch(function (err) {
          /* istanbul ignore if */
          if (err.status !== 404) {
            throw err;
          }
          return LOWEST_SEQ;
        });
    }

    return self.target
      .get(self.id)
      .then(function (targetDoc) {
        if (
          self.opts &&
          self.opts.writeTargetCheckpoint &&
          !self.opts.writeSourceCheckpoint
        ) {
          return targetDoc.last_seq || LOWEST_SEQ;
        }

        return self.src.get(self.id).then(
          function (sourceDoc) {
            // Since we can't migrate an old version doc to a new one
            // (no session id), we just go with the lowest seq in this case
            /* istanbul ignore if */
            if (targetDoc.version !== sourceDoc.version) {
              return LOWEST_SEQ;
            }

            let version;
            if (targetDoc.version) {
              version = targetDoc.version.toString();
            } else {
              version = 'undefined';
            }

            if (version in comparisons) {
              return comparisons[version](targetDoc, sourceDoc);
            }
            /* istanbul ignore next */
            return LOWEST_SEQ;
          },
          function (err) {
            if (err.status === 404 && targetDoc.last_seq) {
              return self.src
                .put({
                  _id: self.id,
                  last_seq: LOWEST_SEQ,
                })
                .then(
                  function () {
                    return LOWEST_SEQ;
                  },
                  function (err) {
                    if (isForbiddenError(err)) {
                      self.opts.writeSourceCheckpoint = false;
                      return targetDoc.last_seq;
                    }
                    /* istanbul ignore next */
                    return LOWEST_SEQ;
                  },
                );
            }
            throw err;
          },
        );
      })
      .catch(function (err) {
        if (err.status !== 404) {
          throw err;
        }
        return LOWEST_SEQ;
      });
  }
}

var comparisons = {
  undefined: function (targetDoc, sourceDoc) {
    // This is the previous comparison function
    if (collate(targetDoc.last_seq, sourceDoc.last_seq) === 0) {
      return sourceDoc.last_seq;
    }
    /* istanbul ignore next */
    return 0;
  },
  1: function (targetDoc, sourceDoc) {
    // This is the comparison function ported from CouchDB
    return compareReplicationLogs(sourceDoc, targetDoc).last_seq;
  },
};

// This checkpoint comparison is ported from CouchDBs source
// they come from here:
// https://github.com/apache/couchdb-couch-replicator/blob/master/src/couch_replicator.erl#L863-L906

function compareReplicationLogs(srcDoc, tgtDoc) {
  if (srcDoc.session_id === tgtDoc.session_id) {
    return {
      last_seq: srcDoc.last_seq,
      history: srcDoc.history,
    };
  }

  return compareReplicationHistory(srcDoc.history, tgtDoc.history);
}

function compareReplicationHistory(sourceHistory, targetHistory) {
  // the erlang loop via function arguments is not so easy to repeat in JS
  // therefore, doing this as recursion
  const S = sourceHistory[0];
  const sourceRest = sourceHistory.slice(1);
  const T = targetHistory[0];
  const targetRest = targetHistory.slice(1);

  if (!S || targetHistory.length === 0) {
    return {
      last_seq: LOWEST_SEQ,
      history: [],
    };
  }

  const sourceId = S.session_id;
  /* istanbul ignore if */
  if (hasSessionId(sourceId, targetHistory)) {
    return {
      last_seq: S.last_seq,
      history: sourceHistory,
    };
  }

  const targetId = T.session_id;
  if (hasSessionId(targetId, sourceRest)) {
    return {
      last_seq: T.last_seq,
      history: targetRest,
    };
  }

  return compareReplicationHistory(sourceRest, targetRest);
}

function hasSessionId(sessionId, history) {
  const props = history[0];
  const rest = history.slice(1);

  if (!sessionId || history.length === 0) {
    return false;
  }

  if (sessionId === props.session_id) {
    return true;
  }

  return hasSessionId(sessionId, rest);
}

function isForbiddenError(err) {
  return typeof err.status === 'number' && Math.floor(err.status / 100) === 4;
}

function Checkpointer(src, target, id, returnValue, opts) {
  // @ts-expect-error fix-types
  if (!(this instanceof CheckpointerInternal)) {
    return new CheckpointerInternal(src, target, id, returnValue, opts);
  }

  return Checkpointer;
}

export default Checkpointer;
