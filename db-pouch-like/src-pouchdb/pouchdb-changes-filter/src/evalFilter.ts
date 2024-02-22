import vm from 'vm';

function evalFilter(input: string) {
  const code = '(function() {\n"use strict";\nreturn ' + input + '\n})()';

  return vm.runInNewContext(code);
}

export default evalFilter;
