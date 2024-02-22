// most of this is borrowed from lodash.isPlainObject:
// https://github.com/fis-components/lodash.isplainobject/
// blob/29c358140a74f252aeb08c9eb28bef86f2217d4a/index.js

const funcToString = Function.prototype.toString;
const objectCtorString = funcToString.call(Object);

function isPlainObject(value) {
  const proto = Object.getPrototypeOf(value);
  /* istanbul ignore if */
  if (proto === null) {
    // not sure when this happens, but I guess it can
    return true;
  }
  const Ctor = proto.constructor;
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    funcToString.call(Ctor) === objectCtorString
  );
}

export default isPlainObject;
