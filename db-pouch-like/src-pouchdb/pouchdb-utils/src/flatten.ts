function flatten(arrs) {
  let res = [];
  for (let i = 0, len = arrs.length; i < len; i++) {
    res = res.concat(arrs[i]);
  }
  return res;
}

export default flatten;
