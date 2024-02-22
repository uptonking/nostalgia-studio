function once(fun: (...args: any[]) => any) {
  let called = false;
  return (...args: any[]) => {
    /* istanbul ignore if */
    if (called) {
      // this is a smoke test and should never actually happen
      throw new Error('once called more than once');
    } else {
      called = true;
      // fun.apply(this, args);
      fun.apply(fun, args);
    }
  };
}

export default once;
