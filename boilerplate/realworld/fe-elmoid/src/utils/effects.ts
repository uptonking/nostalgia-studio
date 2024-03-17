function consoleEffect(_, args) {
  // eslint-disable-next-line no-console
  console.log.apply(null, args);
}

/**
 * Describes an effect that will call [`console.log`](https://developer.mozilla.org/en-US/docs/Web/API/Console/log) with arguments. Useful for development and debugging. Not recommended for production.
 *
 * const ConsoleAction = state => [
 *   state,
 *   Console(
 *     "string arg",
 *     { object: "arg" },
 *     ["list", "of", "args"],
 *     someOtherArg
 *   )
 * ]
 */
export function Consoling(...args) {
  return [consoleEffect, args];
}
