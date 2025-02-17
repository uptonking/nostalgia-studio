function wordRegexp(words) {
  return new RegExp('^((' + words.join(')|(') + '))\\b');
}

const singleOperators = /[\^@!\|<>#~\.\*\-\+\\/,=]/;
const doubleOperators =
  /(<-)|(:=)|(=<)|(>=)|(<=)|(<:)|(>:)|(=:)|(\\=)|(\\=:)|(!!)|(==)|(::)/;
const tripleOperators = /(:::)|(\.\.\.)|(=<:)|(>=:)/;

const middle = [
  'in',
  'then',
  'else',
  'of',
  'elseof',
  'elsecase',
  'elseif',
  'catch',
  'finally',
  'with',
  'require',
  'prepare',
  'import',
  'export',
  'define',
  'do',
];
const end = ['end'];

const atoms = wordRegexp(['true', 'false', 'nil', 'unit']);
const commonKeywords = wordRegexp([
  'andthen',
  'at',
  'attr',
  'declare',
  'feat',
  'from',
  'lex',
  'mod',
  'div',
  'mode',
  'orelse',
  'parser',
  'prod',
  'prop',
  'scanner',
  'self',
  'syn',
  'token',
]);
const openingKeywords = wordRegexp([
  'local',
  'proc',
  'fun',
  'case',
  'class',
  'if',
  'cond',
  'or',
  'dis',
  'choice',
  'not',
  'thread',
  'try',
  'raise',
  'lock',
  'for',
  'suchthat',
  'meth',
  'functor',
]);
const middleKeywords = wordRegexp(middle);
const endKeywords = wordRegexp(end);

// Tokenizers
function tokenBase(stream, state) {
  if (stream.eatSpace()) {
    return null;
  }

  // Brackets
  if (stream.match(/[{}]/)) {
    return 'bracket';
  }

  // Special [] keyword
  if (stream.match('[]')) {
    return 'keyword';
  }

  // Operators
  if (stream.match(tripleOperators) || stream.match(doubleOperators)) {
    return 'operator';
  }

  // Atoms
  if (stream.match(atoms)) {
    return 'atom';
  }

  // Opening keywords
  const matched = stream.match(openingKeywords);
  if (matched) {
    if (!state.doInCurrentLine) state.currentIndent++;
    else state.doInCurrentLine = false;

    // Special matching for signatures
    if (matched[0] == 'proc' || matched[0] == 'fun')
      state.tokenize = tokenFunProc;
    else if (matched[0] == 'class') state.tokenize = tokenClass;
    else if (matched[0] == 'meth') state.tokenize = tokenMeth;

    return 'keyword';
  }

  // Middle and other keywords
  if (stream.match(middleKeywords) || stream.match(commonKeywords)) {
    return 'keyword';
  }

  // End keywords
  if (stream.match(endKeywords)) {
    state.currentIndent--;
    return 'keyword';
  }

  // Eat the next char for next comparisons
  const ch = stream.next();

  // Strings
  if (ch == '"' || ch == "'") {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }

  // Numbers
  if (/[~\d]/.test(ch)) {
    if (ch == '~') {
      if (!/^[0-9]/.test(stream.peek())) return null;
      else if (
        (stream.next() == '0' && stream.match(/^[xX][0-9a-fA-F]+/)) ||
        stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/)
      )
        return 'number';
    }

    if (
      (ch == '0' && stream.match(/^[xX][0-9a-fA-F]+/)) ||
      stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/)
    )
      return 'number';

    return null;
  }

  // Comments
  if (ch == '%') {
    stream.skipToEnd();
    return 'comment';
  } else if (ch == '/') {
    if (stream.eat('*')) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }
  }

  // Single operators
  if (singleOperators.test(ch)) {
    return 'operator';
  }

  // If nothing match, we skip the entire alphanumerical block
  stream.eatWhile(/\w/);

  return 'variable';
}

function tokenClass(stream, state) {
  if (stream.eatSpace()) {
    return null;
  }
  stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)/);
  state.tokenize = tokenBase;
  return 'type';
}

function tokenMeth(stream, state) {
  if (stream.eatSpace()) {
    return null;
  }
  stream.match(/([a-zA-Z][A-Za-z0-9_]*)|(`.+`)/);
  state.tokenize = tokenBase;
  return 'def';
}

function tokenFunProc(stream, state) {
  if (stream.eatSpace()) {
    return null;
  }

  if (!state.hasPassedFirstStage && stream.eat('{')) {
    state.hasPassedFirstStage = true;
    return 'bracket';
  } else if (state.hasPassedFirstStage) {
    stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)|\$/);
    state.hasPassedFirstStage = false;
    state.tokenize = tokenBase;
    return 'def';
  } else {
    state.tokenize = tokenBase;
    return null;
  }
}

function tokenComment(stream, state) {
  let maybeEnd = false;
  let ch;
  while ((ch = stream.next())) {
    if (ch == '/' && maybeEnd) {
      state.tokenize = tokenBase;
      break;
    }
    maybeEnd = ch == '*';
  }
  return 'comment';
}

function tokenString(quote) {
  return function (stream, state) {
    let escaped = false;
    let next;
    let end = false;
    while ((next = stream.next()) != null) {
      if (next == quote && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next == '\\';
    }
    if (end || !escaped) state.tokenize = tokenBase;
    return 'string';
  };
}

function buildElectricInputRegEx() {
  // Reindentation should occur on [] or on a match of any of
  // the block closing keywords, at the end of a line.
  const allClosings = middle.concat(end);
  return new RegExp('[\\[\\]]|(' + allClosings.join('|') + ')$');
}

export const oz = {
  name: 'oz',

  startState: function () {
    return {
      tokenize: tokenBase,
      currentIndent: 0,
      doInCurrentLine: false,
      hasPassedFirstStage: false,
    };
  },

  token: function (stream, state) {
    if (stream.sol()) state.doInCurrentLine = 0;

    return state.tokenize(stream, state);
  },

  indent: function (state, textAfter, cx) {
    const trueText = textAfter.replace(/^\s+|\s+$/g, '');

    if (
      trueText.match(endKeywords) ||
      trueText.match(middleKeywords) ||
      trueText.match(/(\[])/)
    )
      return cx.unit * (state.currentIndent - 1);

    if (state.currentIndent < 0) return 0;

    return state.currentIndent * cx.unit;
  },

  languageData: {
    indentOnInut: buildElectricInputRegEx(),
    commentTokens: { line: '%', block: { open: '/*', close: '*/' } },
  },
};
