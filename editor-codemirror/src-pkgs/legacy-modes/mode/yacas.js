function words(str) {
  const obj = {};
    const words = str.split(' ');
  for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

const bodiedOps = words(
  'Assert BackQuote D Defun Deriv For ForEach FromFile ' +
    'FromString Function Integrate InverseTaylor Limit ' +
    'LocalSymbols Macro MacroRule MacroRulePattern ' +
    'NIntegrate Rule RulePattern Subst TD TExplicitSum ' +
    'TSum Taylor Taylor1 Taylor2 Taylor3 ToFile ' +
    'ToStdout ToString TraceRule Until While',
);

// patterns
const pFloatForm = '(?:(?:\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)';
const pIdentifier = "(?:[a-zA-Z\\$'][a-zA-Z0-9\\$']*)";

// regular expressions
const reFloatForm = new RegExp(pFloatForm);
const reIdentifier = new RegExp(pIdentifier);
const rePattern = new RegExp(pIdentifier + '?_' + pIdentifier);
const reFunctionLike = new RegExp(pIdentifier + '\\s*\\(');

function tokenBase(stream, state) {
  let ch;

  // get next character
  ch = stream.next();

  // string
  if (ch === '"') {
    state.tokenize = tokenString;
    return state.tokenize(stream, state);
  }

  // comment
  if (ch === '/') {
    if (stream.eat('*')) {
      state.tokenize = tokenComment;
      return state.tokenize(stream, state);
    }
    if (stream.eat('/')) {
      stream.skipToEnd();
      return 'comment';
    }
  }

  // go back one character
  stream.backUp(1);

  // update scope info
  const m = stream.match(/^(\w+)\s*\(/, false);
  if (m !== null && bodiedOps.hasOwnProperty(m[1])) state.scopes.push('bodied');

  let scope = currentScope(state);

  if (scope === 'bodied' && ch === '[') state.scopes.pop();

  if (ch === '[' || ch === '{' || ch === '(') state.scopes.push(ch);

  scope = currentScope(state);

  if (
    (scope === '[' && ch === ']') ||
    (scope === '{' && ch === '}') ||
    (scope === '(' && ch === ')')
  )
    state.scopes.pop();

  if (ch === ';') {
    while (scope === 'bodied') {
      state.scopes.pop();
      scope = currentScope(state);
    }
  }

  // look for ordered rules
  if (stream.match(/\d+ *#/, true, false)) {
    return 'qualifier';
  }

  // look for numbers
  if (stream.match(reFloatForm, true, false)) {
    return 'number';
  }

  // look for placeholders
  if (stream.match(rePattern, true, false)) {
    return 'variableName.special';
  }

  // match all braces separately
  if (stream.match(/(?:\[|\]|{|}|\(|\))/, true, false)) {
    return 'bracket';
  }

  // literals looking like function calls
  if (stream.match(reFunctionLike, true, false)) {
    stream.backUp(1);
    return 'variableName.function';
  }

  // all other identifiers
  if (stream.match(reIdentifier, true, false)) {
    return 'variable';
  }

  // operators; note that operators like @@ or /; are matched separately for each symbol.
  if (
    stream.match(
      /(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%|#)/,
      true,
      false,
    )
  ) {
    return 'operator';
  }

  // everything else is an error
  return 'error';
}

function tokenString(stream, state) {
  let next;
    let end = false;
    let escaped = false;
  while ((next = stream.next()) != null) {
    if (next === '"' && !escaped) {
      end = true;
      break;
    }
    escaped = !escaped && next === '\\';
  }
  if (end && !escaped) {
    state.tokenize = tokenBase;
  }
  return 'string';
}

function tokenComment(stream, state) {
  let prev; let next;
  while ((next = stream.next()) != null) {
    if (prev === '*' && next === '/') {
      state.tokenize = tokenBase;
      break;
    }
    prev = next;
  }
  return 'comment';
}

function currentScope(state) {
  let scope = null;
  if (state.scopes.length > 0) scope = state.scopes[state.scopes.length - 1];
  return scope;
}

export const yacas = {
  name: 'yacas',
  startState: function () {
    return {
      tokenize: tokenBase,
      scopes: [],
    };
  },
  token: function (stream, state) {
    if (stream.eatSpace()) return null;
    return state.tokenize(stream, state);
  },
  indent: function (state, textAfter, cx) {
    if (state.tokenize !== tokenBase && state.tokenize !== null) return null;

    let delta = 0;
    if (
      textAfter === ']' ||
      textAfter === '];' ||
      textAfter === '}' ||
      textAfter === '};' ||
      textAfter === ');'
    )
      delta = -1;

    return (state.scopes.length + delta) * cx.unit;
  },

  languageData: {
    electricInput: /[{}\[\]()\;]/,
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
};
