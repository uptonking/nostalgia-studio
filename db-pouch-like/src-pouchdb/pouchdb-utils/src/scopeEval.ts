/** This is basically just a wrapper around `new Function()`
 * - Based on https://github.com/alexdavid/scope-eval v0.0.3
 * - source: https://unpkg.com/scope-eval@0.0.3/scope_eval.js
 */
function scopeEval(source, scope) {
  const keys = [];
  const values = [];
  for (const key in scope) {
    if (Object.hasOwn(scope, key)) {
      keys.push(key);
      values.push(scope[key]);
    }
  }
  keys.push(source);
  return Function.apply(null, keys).apply(null, values);
}

export default scopeEval;
