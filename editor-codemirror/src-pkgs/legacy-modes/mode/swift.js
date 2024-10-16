function wordSet(words) {
  const set = {};
  for (let i = 0; i < words.length; i++) set[words[i]] = true;
  return set;
}

const keywords = wordSet([
  '_',
  'var',
  'let',
  'actor',
  'class',
  'enum',
  'extension',
  'import',
  'protocol',
  'struct',
  'func',
  'typealias',
  'associatedtype',
  'open',
  'public',
  'internal',
  'fileprivate',
  'private',
  'deinit',
  'init',
  'new',
  'override',
  'self',
  'subscript',
  'super',
  'convenience',
  'dynamic',
  'final',
  'indirect',
  'lazy',
  'required',
  'static',
  'unowned',
  'unowned(safe)',
  'unowned(unsafe)',
  'weak',
  'as',
  'is',
  'break',
  'case',
  'continue',
  'default',
  'else',
  'fallthrough',
  'for',
  'guard',
  'if',
  'in',
  'repeat',
  'switch',
  'where',
  'while',
  'defer',
  'return',
  'inout',
  'mutating',
  'nonmutating',
  'isolated',
  'nonisolated',
  'catch',
  'do',
  'rethrows',
  'throw',
  'throws',
  'async',
  'await',
  'try',
  'didSet',
  'get',
  'set',
  'willSet',
  'assignment',
  'associativity',
  'infix',
  'left',
  'none',
  'operator',
  'postfix',
  'precedence',
  'precedencegroup',
  'prefix',
  'right',
  'Any',
  'AnyObject',
  'Type',
  'dynamicType',
  'Self',
  'Protocol',
  '__COLUMN__',
  '__FILE__',
  '__FUNCTION__',
  '__LINE__',
]);
const definingKeywords = wordSet([
  'var',
  'let',
  'actor',
  'class',
  'enum',
  'extension',
  'import',
  'protocol',
  'struct',
  'func',
  'typealias',
  'associatedtype',
  'for',
]);
const atoms = wordSet(['true', 'false', 'nil', 'self', 'super', '_']);
const types = wordSet([
  'Array',
  'Bool',
  'Character',
  'Dictionary',
  'Double',
  'Float',
  'Int',
  'Int8',
  'Int16',
  'Int32',
  'Int64',
  'Never',
  'Optional',
  'Set',
  'String',
  'UInt8',
  'UInt16',
  'UInt32',
  'UInt64',
  'Void',
]);
const operators = '+-/*%=|&<>~^?!';
const punc = ':;,.(){}[]';
const binary = /^\-?0b[01][01_]*/;
const octal = /^\-?0o[0-7][0-7_]*/;
const hexadecimal =
  /^\-?0x[\dA-Fa-f][\dA-Fa-f_]*(?:(?:\.[\dA-Fa-f][\dA-Fa-f_]*)?[Pp]\-?\d[\d_]*)?/;
const decimal = /^\-?\d[\d_]*(?:\.\d[\d_]*)?(?:[Ee]\-?\d[\d_]*)?/;
const identifier = /^\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1/;
const property = /^\.(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/;
const instruction = /^\#[A-Za-z]+/;
const attribute = /^@(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/;
//var regexp = /^\/(?!\s)(?:\/\/)?(?:\\.|[^\/])+\//

function tokenBase(stream, state, prev) {
  if (stream.sol()) state.indented = stream.indentation();
  if (stream.eatSpace()) return null;

  const ch = stream.peek();
  if (ch == '/') {
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match('/*')) {
      state.tokenize.push(tokenComment);
      return tokenComment(stream, state);
    }
  }
  if (stream.match(instruction)) return 'builtin';
  if (stream.match(attribute)) return 'attribute';
  if (stream.match(binary)) return 'number';
  if (stream.match(octal)) return 'number';
  if (stream.match(hexadecimal)) return 'number';
  if (stream.match(decimal)) return 'number';
  if (stream.match(property)) return 'property';
  if (operators.indexOf(ch) > -1) {
    stream.next();
    return 'operator';
  }
  if (punc.indexOf(ch) > -1) {
    stream.next();
    stream.match('..');
    return 'punctuation';
  }
  let stringMatch;
  if ((stringMatch = stream.match(/("""|"|')/))) {
    const tokenize = tokenString.bind(null, stringMatch[0]);
    state.tokenize.push(tokenize);
    return tokenize(stream, state);
  }

  if (stream.match(identifier)) {
    const ident = stream.current();
    if (types.hasOwnProperty(ident)) return 'type';
    if (atoms.hasOwnProperty(ident)) return 'atom';
    if (keywords.hasOwnProperty(ident)) {
      if (definingKeywords.hasOwnProperty(ident)) state.prev = 'define';
      return 'keyword';
    }
    if (prev == 'define') return 'def';
    return 'variable';
  }

  stream.next();
  return null;
}

function tokenUntilClosingParen() {
  let depth = 0;
  return function (stream, state, prev) {
    const inner = tokenBase(stream, state, prev);
    if (inner == 'punctuation') {
      if (stream.current() == '(') ++depth;
      else if (stream.current() == ')') {
        if (depth == 0) {
          stream.backUp(1);
          state.tokenize.pop();
          return state.tokenize[state.tokenize.length - 1](stream, state);
        } else --depth;
      }
    }
    return inner;
  };
}

function tokenString(openQuote, stream, state) {
  const singleLine = openQuote.length == 1;
  let ch;
  let escaped = false;
  while ((ch = stream.peek())) {
    if (escaped) {
      stream.next();
      if (ch == '(') {
        state.tokenize.push(tokenUntilClosingParen());
        return 'string';
      }
      escaped = false;
    } else if (stream.match(openQuote)) {
      state.tokenize.pop();
      return 'string';
    } else {
      stream.next();
      escaped = ch == '\\';
    }
  }
  if (singleLine) {
    state.tokenize.pop();
  }
  return 'string';
}

function tokenComment(stream, state) {
  let ch;
  while ((ch = stream.next())) {
    if (ch === '/' && stream.eat('*')) {
      state.tokenize.push(tokenComment);
    } else if (ch === '*' && stream.eat('/')) {
      state.tokenize.pop();
      break;
    }
  }
  return 'comment';
}

function Context(prev, align, indented) {
  this.prev = prev;
  this.align = align;
  this.indented = indented;
}

function pushContext(state, stream) {
  const align = stream.match(/^\s*($|\/[\/\*]|[)}\]])/, false)
    ? null
    : stream.column() + 1;
  state.context = new Context(state.context, align, state.indented);
}

function popContext(state) {
  if (state.context) {
    state.indented = state.context.indented;
    state.context = state.context.prev;
  }
}

export const swift = {
  name: 'swift',
  startState: function () {
    return {
      prev: null,
      context: null,
      indented: 0,
      tokenize: [],
    };
  },

  token: function (stream, state) {
    const prev = state.prev;
    state.prev = null;
    const tokenize = state.tokenize[state.tokenize.length - 1] || tokenBase;
    const style = tokenize(stream, state, prev);
    if (!style || style == 'comment') state.prev = prev;
    else if (!state.prev) state.prev = style;

    if (style == 'punctuation') {
      const bracket = /[\(\[\{]|([\]\)\}])/.exec(stream.current());
      if (bracket) (bracket[1] ? popContext : pushContext)(state, stream);
    }

    return style;
  },

  indent: function (state, textAfter, iCx) {
    const cx = state.context;
    if (!cx) return 0;
    const closing = /^[\]\}\)]/.test(textAfter);
    if (cx.align != null) return cx.align - (closing ? 1 : 0);
    return cx.indented + (closing ? 0 : iCx.unit);
  },

  languageData: {
    indentOnInput: /^\s*[\)\}\]]$/,
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
  },
};
