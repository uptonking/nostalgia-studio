import { scopeEval } from 'pouchdb-utils';

function evalFilter(input: string) {
  return scopeEval('"use strict";\nreturn ' + input + ';', {});
}

export default evalFilter;
