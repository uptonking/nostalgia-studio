import { stringMd5 } from 'pouchdb-md5';
import { v4 as uuidV4 } from 'uuid';

/**
 * Creates a new revision string that does NOT include the revision height
 * For example '56649f1b0506c6ca9fda0746eb0cacdf'
 */
function rev(doc?: Record<string, any>, deterministic_revs?: string) {
  if (!deterministic_revs) {
    return uuidV4().replace(/-/g, '').toLowerCase();
  }

  const mutateableDoc = { ...doc };
  delete mutateableDoc._rev_tree;
  return stringMd5(JSON.stringify(mutateableDoc));
}

export default rev;
