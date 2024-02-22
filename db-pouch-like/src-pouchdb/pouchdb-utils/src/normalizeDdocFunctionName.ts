import parseDdocFunctionName from './parseDdocFunctionName';

function normalizeDesignDocFunctionName(s) {
  const normalized = parseDdocFunctionName(s);
  return normalized ? normalized.join('/') : null;
}

export default normalizeDesignDocFunctionName;
