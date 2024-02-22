import { guardedConsole, scopeEval } from 'pouchdb-utils';
import sum from './sum';

const log = guardedConsole.bind(null, 'log');
const isArray = Array.isArray;
const toJSON = JSON.parse;

function evalFunctionWithEval(func, emit) {
  return scopeEval('return (' + func.replace(/;\s*$/, '') + ');', {
    emit,
    sum,
    log,
    isArray,
    toJSON,
  });
}

export default evalFunctionWithEval;
