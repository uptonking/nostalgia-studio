function guardedConsole(method: keyof Console, ...restArgs: any[]) {
  /* istanbul ignore else */
  if (typeof console !== 'undefined' && typeof console[method] === 'function') {
    const args = Array.prototype.slice.call(arguments, 1);
    // @ts-expect-error fix-types
    console[method].apply(console, args);
  }
}

export default guardedConsole;
