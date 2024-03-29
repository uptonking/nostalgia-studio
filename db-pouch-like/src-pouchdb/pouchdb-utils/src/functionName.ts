// shim for Function.prototype.name,
// for browsers that don't support it like IE

/* istanbul ignore next */
function f() {}

const hasName = f.name;
let res;

// We don't run coverage in IE
/* istanbul ignore else */
if (hasName) {
  res = function (fun) {
    return fun.name;
  };
} else {
  res = function (fun) {
    const match = fun.toString().match(/^\s*function\s*(?:(\S+)\s*)?\(/);
    if (match && match[1]) {
      return match[1];
    } else {
      return '';
    }
  };
}

export default res;
