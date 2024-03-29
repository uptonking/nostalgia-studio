import Checkpointer from 'pouchdb-checkpointer';
import { createError } from 'pouchdb-errors';
import generateReplicationId from 'pouchdb-generate-replication-id';
import { clone, filterChange, nextTick, uuid } from 'pouchdb-utils';

import backOff from './backoff';
import getDocs from './getDocs';

function replicate(src, target, opts, returnValue, result?) {
  let batches = []; // list of batches to be processed
  let currentBatch; // the batch currently being processed
  let pendingBatch = {
    seq: 0,
    changes: [],
    docs: [],
  }; // next batch, not yet ready to be processed
  let writingCheckpoint = false; // true while checkpoint is being written
  let changesCompleted = false; // true when all changes received
  let replicationCompleted = false; // true when replication has completed
  // initial_last_seq is the state of the source db before
  // replication started, and it is _not_ updated during
  // replication or used anywhere else, as opposed to last_seq
  let initial_last_seq = 0;
  let last_seq = 0;
  const continuous = opts.continuous || opts.live || false;
  const batch_size = opts.batch_size || 100;
  const batches_limit = opts.batches_limit || 10;
  const style = opts.style || 'all_docs';
  let changesPending = false; // true while src.changes is running
  const doc_ids = opts.doc_ids;
  const selector = opts.selector;
  let repId;
  let checkpointer;
  let changedDocs = [];
  // Like couchdb, every replication gets a unique session id
  const session = uuid();
  let taskId;

  result = result || {
    ok: true,
    start_time: new Date().toISOString(),
    docs_read: 0,
    docs_written: 0,
    doc_write_failures: 0,
    errors: [],
  };

  let changesOpts: Record<string, any> = {};
  returnValue.ready(src, target);

  function initCheckpointer() {
    if (checkpointer) {
      return Promise.resolve();
    }
    return generateReplicationId(src, target, opts).then(function (res) {
      repId = res;

      let checkpointOpts = {};
      if (opts.checkpoint === false) {
        checkpointOpts = {
          writeSourceCheckpoint: false,
          writeTargetCheckpoint: false,
        };
      } else if (opts.checkpoint === 'source') {
        checkpointOpts = {
          writeSourceCheckpoint: true,
          writeTargetCheckpoint: false,
        };
      } else if (opts.checkpoint === 'target') {
        checkpointOpts = {
          writeSourceCheckpoint: false,
          writeTargetCheckpoint: true,
        };
      } else {
        checkpointOpts = {
          writeSourceCheckpoint: true,
          writeTargetCheckpoint: true,
        };
      }

      //@ts-expect-error fix-types
      checkpointer = new Checkpointer(
        src,
        target,
        repId,
        returnValue,
        checkpointOpts,
      );
    });
  }

  function writeDocs() {
    changedDocs = [];

    if (currentBatch.docs.length === 0) {
      return;
    }
    const docs = currentBatch.docs;
    const bulkOpts = { timeout: opts.timeout };
    return target.bulkDocs({ docs, new_edits: false }, bulkOpts).then(
      function (res) {
        /* istanbul ignore if */
        if (returnValue.cancelled) {
          completeReplication();
          throw new Error('cancelled');
        }

        // `res` doesn't include full documents (which live in `docs`), so we create a map of
        // (id -> error), and check for errors while iterating over `docs`
        const errorsById = Object.create(null);
        res.forEach(function (res) {
          if (res.error) {
            errorsById[res.id] = res;
          }
        });

        const errorsNo = Object.keys(errorsById).length;
        result.doc_write_failures += errorsNo;
        result.docs_written += docs.length - errorsNo;

        docs.forEach(function (doc) {
          const error = errorsById[doc._id];
          if (error) {
            result.errors.push(error);
            // Normalize error name. i.e. 'Unauthorized' -> 'unauthorized' (eg Sync Gateway)
            const errorName = (error.name || '').toLowerCase();
            if (errorName === 'unauthorized' || errorName === 'forbidden') {
              returnValue.emit('denied', clone(error));
            } else {
              throw error;
            }
          } else {
            changedDocs.push(doc);
          }
        });
      },
      function (err) {
        result.doc_write_failures += docs.length;
        throw err;
      },
    );
  }

  function finishBatch() {
    if (currentBatch.error) {
      throw new Error('There was a problem getting docs.');
    }
    result.last_seq = last_seq = currentBatch.seq;
    const outResult = clone(result);
    if (changedDocs.length) {
      outResult.docs = changedDocs;
      // Attach 'pending' property if server supports it (CouchDB 2.0+)
      /* istanbul ignore if */
      if (typeof currentBatch.pending === 'number') {
        outResult.pending = currentBatch.pending;
        delete currentBatch.pending;
      }
      returnValue.emit('change', outResult);
    }
    writingCheckpoint = true;

    src.info().then(function (info) {
      const task = src.activeTasks.get(taskId);
      if (!currentBatch || !task) {
        return;
      }

      const completed = task.completed_items || 0;
      const total_items =
        // @ts-expect-error fix-types
        parseInt(info.update_seq, 10) - parseInt(initial_last_seq, 10);
      src.activeTasks.update(taskId, {
        completed_items: completed + currentBatch.changes.length,
        total_items,
      });
    });

    return checkpointer
      .writeCheckpoint(currentBatch.seq, session)
      .then(function () {
        returnValue.emit('checkpoint', { checkpoint: currentBatch.seq });
        writingCheckpoint = false;
        /* istanbul ignore if */
        if (returnValue.cancelled) {
          completeReplication();
          throw new Error('cancelled');
        }
        currentBatch = undefined;
        getChanges();
      })
      .catch(function (err) {
        onCheckpointError(err);
        throw err;
      });
  }

  function getDiffs() {
    const diff = {};
    currentBatch.changes.forEach(function (change) {
      returnValue.emit('checkpoint', { revs_diff: change });
      // Couchbase Sync Gateway emits these, but we can ignore them
      /* istanbul ignore if */
      if (change.id === '_user/') {
        return;
      }
      diff[change.id] = change.changes.map(function (x) {
        return x.rev;
      });
    });
    return target.revsDiff(diff).then(function (diffs) {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      // currentBatch.diffs elements are deleted as the documents are written
      currentBatch.diffs = diffs;
    });
  }

  function getBatchDocs() {
    return getDocs(src, target, currentBatch.diffs, returnValue).then(
      function (got) {
        currentBatch.error = !got.ok;
        got.docs.forEach(function (doc) {
          delete currentBatch.diffs[doc._id];
          result.docs_read++;
          currentBatch.docs.push(doc);
        });
      },
    );
  }

  function startNextBatch() {
    if (returnValue.cancelled || currentBatch) {
      return;
    }
    if (batches.length === 0) {
      processPendingBatch(true);
      return;
    }
    currentBatch = batches.shift();
    returnValue.emit('checkpoint', { start_next_batch: currentBatch.seq });
    getDiffs()
      .then(getBatchDocs)
      .then(writeDocs)
      .then(finishBatch)
      .then(startNextBatch)
      .catch(function (err) {
        abortReplication('batch processing terminated with error', err);
      });
  }

  function processPendingBatch(immediate) {
    if (pendingBatch.changes.length === 0) {
      if (batches.length === 0 && !currentBatch) {
        if ((continuous && changesOpts['live']) || changesCompleted) {
          returnValue.state = 'pending';
          returnValue.emit('paused');
        }
        if (changesCompleted) {
          completeReplication();
        }
      }
      return;
    }
    if (
      immediate ||
      changesCompleted ||
      pendingBatch.changes.length >= batch_size
    ) {
      batches.push(pendingBatch);
      pendingBatch = {
        seq: 0,
        changes: [],
        docs: [],
      };
      if (returnValue.state === 'pending' || returnValue.state === 'stopped') {
        returnValue.state = 'active';
        returnValue.emit('active');
      }
      startNextBatch();
    }
  }

  function abortReplication(reason, err) {
    if (replicationCompleted) {
      return;
    }
    if (!err.message) {
      err.message = reason;
    }
    result.ok = false;
    result.status = 'aborting';
    batches = [];
    pendingBatch = {
      seq: 0,
      changes: [],
      docs: [],
    };
    completeReplication(err);
  }

  function completeReplication(fatalError?) {
    if (replicationCompleted) {
      return;
    }
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      result.status = 'cancelled';
      if (writingCheckpoint) {
        return;
      }
    }
    result.status = result.status || 'complete';
    result.end_time = new Date().toISOString();
    result.last_seq = last_seq;
    replicationCompleted = true;

    src.activeTasks.remove(taskId, fatalError);

    if (fatalError) {
      // need to extend the error because Firefox considers ".result" read-only
      fatalError = createError(fatalError);
      fatalError.result = result;

      // Normalize error name. i.e. 'Unauthorized' -> 'unauthorized' (eg Sync Gateway)
      const errorName = (fatalError.name || '').toLowerCase();
      if (errorName === 'unauthorized' || errorName === 'forbidden') {
        returnValue.emit('error', fatalError);
        returnValue.removeAllListeners();
      } else {
        backOff(opts, returnValue, fatalError, function () {
          replicate(src, target, opts, returnValue);
        });
      }
    } else {
      returnValue.emit('complete', result);
      returnValue.removeAllListeners();
    }
  }

  function onChange(change, pending, lastSeq) {
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    // Attach 'pending' property if server supports it (CouchDB 2.0+)
    /* istanbul ignore if */
    if (typeof pending === 'number') {
      pendingBatch['pending'] = pending;
    }

    const filter = filterChange(opts)(change);
    if (!filter) {
      // update processed items count by 1
      const task = src.activeTasks.get(taskId);
      if (task) {
        // we can assume that task exists here? shouldn't be deleted by here.
        let completed = task.completed_items || 0;
        src.activeTasks.update(taskId, { completed_items: ++completed });
      }
      return;
    }
    pendingBatch.seq = change.seq || lastSeq;
    pendingBatch.changes.push(change);
    returnValue.emit('checkpoint', { pending_batch: pendingBatch.seq });
    nextTick(function () {
      processPendingBatch(batches.length === 0 && changesOpts.live);
    });
  }

  function onChangesComplete(changes) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }

    // if no results were returned then we're done,
    // else fetch more
    if (changes.results.length > 0) {
      changesOpts.since = changes.results[changes.results.length - 1].seq;
      getChanges();
      processPendingBatch(true);
    } else {
      const complete = function () {
        if (continuous) {
          changesOpts.live = true;
          getChanges();
        } else {
          changesCompleted = true;
        }
        processPendingBatch(true);
      };

      // update the checkpoint so we start from the right seq next time
      if (!currentBatch && changes.results.length === 0) {
        writingCheckpoint = true;
        checkpointer
          .writeCheckpoint(changes.last_seq, session)
          .then(function () {
            writingCheckpoint = false;
            result.last_seq = last_seq = changes.last_seq;
            if (returnValue.cancelled) {
              completeReplication();
              throw new Error('cancelled');
            } else {
              complete();
            }
          })
          .catch(onCheckpointError);
      } else {
        complete();
      }
    }
  }

  function onChangesError(err) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    abortReplication('changes rejected', err);
  }

  function getChanges() {
    if (
      !(!changesPending && !changesCompleted && batches.length < batches_limit)
    ) {
      return;
    }
    changesPending = true;
    function abortChanges() {
      changes.cancel();
    }
    function removeListener() {
      returnValue.removeListener('cancel', abortChanges);
    }

    if (returnValue._changes) {
      // remove old changes() and listeners
      returnValue.removeListener('cancel', returnValue._abortChanges);
      returnValue._changes.cancel();
    }
    returnValue.once('cancel', abortChanges);

    var changes = src.changes(changesOpts).on('change', onChange);
    changes.then(removeListener, removeListener);
    changes.then(onChangesComplete).catch(onChangesError);

    if (opts.retry) {
      // save for later so we can cancel if necessary
      returnValue._changes = changes;
      returnValue._abortChanges = abortChanges;
    }
  }

  function createTask(checkpoint) {
    return src.info().then(function (info) {
      const total_items =
        typeof opts.since === 'undefined'
          ? parseInt(info.update_seq, 10) - parseInt(checkpoint, 10)
          : parseInt(info.update_seq, 10);

      taskId = src.activeTasks.add({
        name: `${continuous ? 'continuous ' : ''}replication from ${
          info.db_name
        }`,
        total_items,
      });

      return checkpoint;
    });
  }

  function startChanges() {
    initCheckpointer()
      .then(function () {
        /* istanbul ignore if */
        if (returnValue.cancelled) {
          completeReplication();
          return;
        }
        return checkpointer
          .getCheckpoint()
          .then(createTask)
          .then(function (checkpoint) {
            last_seq = checkpoint;
            initial_last_seq = checkpoint;
            changesOpts = {
              since: last_seq,
              limit: batch_size,
              batch_size,
              style,
              doc_ids,
              selector,
              return_docs: true, // required so we know when we're done
            };
            if (opts.filter) {
              if (typeof opts.filter !== 'string') {
                // required for the client-side filter in onChange
                changesOpts.include_docs = true;
              } else {
                // ddoc filter
                changesOpts.filter = opts.filter;
              }
            }
            if ('heartbeat' in opts) {
              changesOpts.heartbeat = opts.heartbeat;
            }
            if ('timeout' in opts) {
              changesOpts.timeout = opts.timeout;
            }
            if (opts.query_params) {
              changesOpts.query_params = opts.query_params;
            }
            if (opts.view) {
              changesOpts.view = opts.view;
            }
            getChanges();
          });
      })
      .catch(function (err) {
        abortReplication('getCheckpoint rejected with ', err);
      });
  }

  /* istanbul ignore next */
  function onCheckpointError(err) {
    writingCheckpoint = false;
    abortReplication('writeCheckpoint completed with error', err);
  }

  /* istanbul ignore if */
  if (returnValue.cancelled) {
    // cancelled immediately
    completeReplication();
    return;
  }

  if (!returnValue._addedListeners) {
    returnValue.once('cancel', completeReplication);

    if (typeof opts.complete === 'function') {
      returnValue.once('error', opts.complete);
      returnValue.once('complete', function (result) {
        opts.complete(null, result);
      });
    }
    returnValue._addedListeners = true;
  }

  if (typeof opts.since === 'undefined') {
    startChanges();
  } else {
    initCheckpointer()
      .then(function () {
        writingCheckpoint = true;
        return checkpointer.writeCheckpoint(opts.since, session);
      })
      .then(function () {
        writingCheckpoint = false;
        /* istanbul ignore if */
        if (returnValue.cancelled) {
          completeReplication();
          return;
        }
        last_seq = opts.since;
        startChanges();
      })
      .catch(onCheckpointError);
  }
}

export default replicate;
