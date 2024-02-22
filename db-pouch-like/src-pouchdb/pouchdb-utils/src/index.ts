import { v4 } from 'uuid';

import adapterFun from './adapterFun';
import assign from './assign';
import bulkGetShim from './bulkGetShim';
import changesHandler from './changesHandler';
import clone from './clone';
import defaultBackOff from './defaultBackOff';
import hasLocalStorage from './env/hasLocalStorage';
import explainError from './explainError';
import filterChange from './filterChange';
import flatten from './flatten';
import functionName from './functionName';
import guardedConsole from './guardedConsole';
import invalidIdError from './invalidIdError';
import isRemote from './isRemote';
import listenerCount from './listenerCount';
import nextTick from './nextTick';
import normalizeDdocFunctionName from './normalizeDdocFunctionName';
import once from './once';
import parseDdocFunctionName from './parseDdocFunctionName';
import parseUri from './parseUri';
import pick from './pick';
import rev from './rev';
import scopeEval from './scopeEval';
import toPromise from './toPromise';
import upsert from './upsert';

// mimic old import, only v4 is ever used elsewhere
const uuid = v4;

export {
  adapterFun,
  assign,
  bulkGetShim,
  changesHandler,
  clone,
  defaultBackOff,
  explainError,
  filterChange,
  flatten,
  functionName,
  guardedConsole,
  hasLocalStorage,
  invalidIdError,
  isRemote,
  listenerCount,
  nextTick,
  normalizeDdocFunctionName,
  once,
  parseDdocFunctionName,
  parseUri,
  pick,
  rev,
  scopeEval,
  toPromise,
  upsert,
  uuid,
};
