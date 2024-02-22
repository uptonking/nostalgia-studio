import traverseRevTree from './traverseRevTree';

function sortByPos(a, b) {
  return a.pos - b.pos;
}

function collectLeaves(revs) {
  const leaves = [];
  traverseRevTree(revs, function (isLeaf, pos, id, acc, opts) {
    if (isLeaf) {
      leaves.push({ rev: pos + '-' + id, pos, opts });
    }
  });
  leaves.sort(sortByPos).reverse();
  for (let i = 0, len = leaves.length; i < len; i++) {
    delete leaves[i].pos;
  }
  return leaves;
}

export default collectLeaves;
