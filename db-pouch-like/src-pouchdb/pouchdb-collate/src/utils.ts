function pad(str, padWith, upToLength) {
  let padding = '';
  const targetLength = upToLength - str.length;
  /* istanbul ignore next */
  while (padding.length < targetLength) {
    padding += padWith;
  }
  return padding;
}

function padLeft(str, padWith, upToLength) {
  const padding = pad(str, padWith, upToLength);
  return padding + str;
}

function padRight(str, padWith, upToLength) {
  const padding = pad(str, padWith, upToLength);
  return str + padding;
}

function stringLexCompare(a, b) {
  const aLen = a.length;
  const bLen = b.length;

  let i;
  for (i = 0; i < aLen; i++) {
    if (i === bLen) {
      // b is shorter substring of a
      return 1;
    }
    const aChar = a.charAt(i);
    const bChar = b.charAt(i);
    if (aChar !== bChar) {
      return aChar < bChar ? -1 : 1;
    }
  }

  if (aLen < bLen) {
    // a is shorter substring of b
    return -1;
  }

  return 0;
}

/*
 * returns the decimal form for the given integer, i.e. writes
 * out all the digits (in base-10) instead of using scientific notation
 */
function intToDecimalForm(int) {
  const isNeg = int < 0;
  let result = '';

  do {
    const remainder = isNeg ? -Math.ceil(int % 10) : Math.floor(int % 10);

    result = remainder + result;
    int = isNeg ? Math.ceil(int / 10) : Math.floor(int / 10);
  } while (int);

  if (isNeg && result !== '0') {
    result = '-' + result;
  }

  return result;
}

export { padLeft, padRight, stringLexCompare, intToDecimalForm };
