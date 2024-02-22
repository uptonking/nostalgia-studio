import createBuiltInError from './createBuiltInError';

function sum(values) {
  let result: number | number[] = 0;
  for (let i = 0, len = values.length; i < len; i++) {
    const num = values[i];
    if (typeof num !== 'number') {
      if (Array.isArray(num)) {
        // lists of numbers are also allowed, sum them separately
        result = typeof result === 'number' ? [result] : result;
        for (let j = 0, jLen = num.length; j < jLen; j++) {
          const jNum = num[j];
          if (typeof jNum !== 'number') {
            throw createBuiltInError('_sum');
          } else if (typeof result[j] === 'undefined') {
            result.push(jNum);
          } else {
            result[j] += jNum;
          }
        }
      } else {
        // not array/number
        throw createBuiltInError('_sum');
      }
    } else if (typeof result === 'number') {
      result += num;
    } else {
      // add number to array
      result[0] += num;
    }
  }
  return result;
}

export default sum;
