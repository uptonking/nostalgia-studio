export = autoResize;
/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */
declare function autoResize(): {
  init: (el_: any, config: any, doObserve: any) => void;
  unObserve: () => void;
  resize: (newChar: any) => void;
};
//# sourceMappingURL=autoResize.d.ts.map
