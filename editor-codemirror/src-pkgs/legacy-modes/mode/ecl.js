function words(str) {
  const obj = {};
  const words = str.split(' ');
  for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

function metaHook(stream, state) {
  if (!state.startOfLine) return false;
  stream.skipToEnd();
  return 'meta';
}

const keyword = words(
  'abs acos allnodes ascii asin asstring atan atan2 ave case choose choosen choosesets clustersize combine correlation cos cosh count covariance cron dataset dedup define denormalize distribute distributed distribution ebcdic enth error evaluate event eventextra eventname exists exp failcode failmessage fetch fromunicode getisvalid global graph group hash hash32 hash64 hashcrc hashmd5 having if index intformat isvalid iterate join keyunicode length library limit ln local log loop map matched matchlength matchposition matchtext matchunicode max merge mergejoin min nolocal nonempty normalize parse pipe power preload process project pull random range rank ranked realformat recordof regexfind regexreplace regroup rejected rollup round roundup row rowdiff sample set sin sinh sizeof soapcall sort sorted sqrt stepped stored sum table tan tanh thisnode topn tounicode transfer trim truncate typeof ungroup unicodeorder variance which workunit xmldecode xmlencode xmltext xmlunicode',
);
const variable = words(
  'apply assert build buildindex evaluate fail keydiff keypatch loadxml nothor notify output parallel sequential soapcall wait',
);
const variable_2 = words(
  '__compressed__ all and any as atmost before beginc++ best between case const counter csv descend encrypt end endc++ endmacro except exclusive expire export extend false few first flat from full function group header heading hole ifblock import in interface joined keep keyed last left limit load local locale lookup macro many maxcount maxlength min skew module named nocase noroot noscan nosort not of only opt or outer overwrite packed partition penalty physicallength pipe quote record relationship repeat return right scan self separator service shared skew skip sql store terminator thor threshold token transform trim true type unicodeorder unsorted validate virtual whole wild within xml xpath',
);
const variable_3 = words(
  'ascii big_endian boolean data decimal ebcdic integer pattern qstring real record rule set of string token udecimal unicode unsigned varstring varunicode',
);
const builtin = words(
  'checkpoint deprecated failcode failmessage failure global independent onwarning persist priority recovery stored success wait when',
);
const blockKeywords = words(
  'catch class do else finally for if switch try while',
);
const atoms = words('true false null');
const hooks = { '#': metaHook };
const isOperatorChar = /[+\-*&%=<>!?|\/]/;

let curPunc;

function tokenBase(stream, state) {
  const ch = stream.next();
  if (hooks[ch]) {
    const result = hooks[ch](stream, state);
    if (result !== false) return result;
  }
  if (ch == '"' || ch == "'") {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }
  if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
    curPunc = ch;
    return null;
  }
  if (/\d/.test(ch)) {
    stream.eatWhile(/[\w\.]/);
    return 'number';
  }
  if (ch == '/') {
    if (stream.eat('*')) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }
    if (stream.eat('/')) {
      stream.skipToEnd();
      return 'comment';
    }
  }
  if (isOperatorChar.test(ch)) {
    stream.eatWhile(isOperatorChar);
    return 'operator';
  }
  stream.eatWhile(/[\w\$_]/);
  const cur = stream.current().toLowerCase();
  if (keyword.propertyIsEnumerable(cur)) {
    if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
    return 'keyword';
  } else if (variable.propertyIsEnumerable(cur)) {
    if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
    return 'variable';
  } else if (variable_2.propertyIsEnumerable(cur)) {
    if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
    return 'modifier';
  } else if (variable_3.propertyIsEnumerable(cur)) {
    if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
    return 'type';
  } else if (builtin.propertyIsEnumerable(cur)) {
    if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
    return 'builtin';
  } else {
    //Data types are of from KEYWORD##
    let i = cur.length - 1;
    while (i >= 0 && (!isNaN(cur[i]) || cur[i] == '_')) --i;

    if (i > 0) {
      const cur2 = cur.substr(0, i + 1);
      if (variable_3.propertyIsEnumerable(cur2)) {
        if (blockKeywords.propertyIsEnumerable(cur2)) curPunc = 'newstatement';
        return 'type';
      }
    }
  }
  if (atoms.propertyIsEnumerable(cur)) return 'atom';
  return null;
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

function Context(indented, column, type, align, prev) {
  this.indented = indented;
  this.column = column;
  this.type = type;
  this.align = align;
  this.prev = prev;
}
function pushContext(state, col, type) {
  return (state.context = new Context(
    state.indented,
    col,
    type,
    null,
    state.context,
  ));
}
function popContext(state) {
  const t = state.context.type;
  if (t == ')' || t == ']' || t == '}') state.indented = state.context.indented;
  return (state.context = state.context.prev);
}

// Interface

export const ecl = {
  name: 'ecl',
  startState: function (indentUnit) {
    return {
      tokenize: null,
      context: new Context(-indentUnit, 0, 'top', false),
      indented: 0,
      startOfLine: true,
    };
  },

  token: function (stream, state) {
    let ctx = state.context;
    if (stream.sol()) {
      if (ctx.align == null) ctx.align = false;
      state.indented = stream.indentation();
      state.startOfLine = true;
    }
    if (stream.eatSpace()) return null;
    curPunc = null;
    const style = (state.tokenize || tokenBase)(stream, state);
    if (style == 'comment' || style == 'meta') return style;
    if (ctx.align == null) ctx.align = true;

    if ((curPunc == ';' || curPunc == ':') && ctx.type == 'statement')
      popContext(state);
    else if (curPunc == '{') pushContext(state, stream.column(), '}');
    else if (curPunc == '[') pushContext(state, stream.column(), ']');
    else if (curPunc == '(') pushContext(state, stream.column(), ')');
    else if (curPunc == '}') {
      while (ctx.type == 'statement') ctx = popContext(state);
      if (ctx.type == '}') ctx = popContext(state);
      while (ctx.type == 'statement') ctx = popContext(state);
    } else if (curPunc == ctx.type) popContext(state);
    else if (
      ctx.type == '}' ||
      ctx.type == 'top' ||
      (ctx.type == 'statement' && curPunc == 'newstatement')
    )
      pushContext(state, stream.column(), 'statement');
    state.startOfLine = false;
    return style;
  },

  indent: function (state, textAfter, cx) {
    if (state.tokenize != tokenBase && state.tokenize != null) return 0;
    let ctx = state.context;
    const firstChar = textAfter && textAfter.charAt(0);
    if (ctx.type == 'statement' && firstChar == '}') ctx = ctx.prev;
    const closing = firstChar == ctx.type;
    if (ctx.type == 'statement')
      return ctx.indented + (firstChar == '{' ? 0 : cx.unit);
    else if (ctx.align) return ctx.column + (closing ? 0 : 1);
    else return ctx.indented + (closing ? 0 : cx.unit);
  },

  languageData: {
    indentOnInput: /^\s*[{}]$/,
  },
};
