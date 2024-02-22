import winningRev from './winningRev';

function getTrees(node) {
  return node.ids;
}

/** check if a specific revision of a doc has been deleted
 *  - metadata: the metadata object from the doc store
 *  - rev: (optional) the revision to check. defaults to winning revision
 */
function isDeleted(metadata: { rev_tree: any[] }, rev?: string) {
  if (!rev) {
    rev = winningRev(metadata);
  }
  const id = rev.substring(rev.indexOf('-') + 1);
  let toVisit = metadata.rev_tree.map(getTrees);

  let tree;
  while ((tree = toVisit.pop())) {
    if (tree[0] === id) {
      return Boolean(tree[1].deleted);
    }
    toVisit = toVisit.concat(tree[2]);
  }
}

export default isDeleted;
