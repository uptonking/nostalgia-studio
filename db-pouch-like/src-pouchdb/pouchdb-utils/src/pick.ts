/** like underscore/lodash _.pick() */
function pick(obj, arr) {
  const res = {};
  for (let i = 0, len = arr.length; i < len; i++) {
    const prop = arr[i];
    if (prop in obj) {
      res[prop] = obj[prop];
    }
  }
  return res;
}

export default pick;
