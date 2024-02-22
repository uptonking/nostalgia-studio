function inherits(A, B) {
  A.prototype = Object.create(B.prototype, {
    constructor: { value: A },
  });
}

export function createClass(parent, init) {
  const klass = function (...args) {
    // @ts-expect-error fix-types
    if (!(this instanceof klass)) {
      // @ts-expect-error fix-types
      return new klass(...args);
    }

    // @ts-expect-error fix-types
    init.apply(this, args);
  };
  inherits(klass, parent);

  return klass;
}
