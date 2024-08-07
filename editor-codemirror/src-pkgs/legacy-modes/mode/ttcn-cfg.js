function words(str) {
  const obj = {};
  const words = str.split(' ');
  for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

const parserConfig = {
  name: 'ttcn-cfg',
  keywords: words(
    'Yes No LogFile FileMask ConsoleMask AppendFile' +
      ' TimeStampFormat LogEventTypes SourceInfoFormat' +
      ' LogEntityName LogSourceInfo DiskFullAction' +
      ' LogFileNumber LogFileSize MatchingHints Detailed' +
      ' Compact SubCategories Stack Single None Seconds' +
      ' DateTime Time Stop Error Retry Delete TCPPort KillTimer' +
      ' NumHCs UnixSocketsEnabled LocalAddress',
  ),
  fileNCtrlMaskOptions: words(
    'TTCN_EXECUTOR TTCN_ERROR TTCN_WARNING' +
      ' TTCN_PORTEVENT TTCN_TIMEROP TTCN_VERDICTOP' +
      ' TTCN_DEFAULTOP TTCN_TESTCASE TTCN_ACTION' +
      ' TTCN_USER TTCN_FUNCTION TTCN_STATISTICS' +
      ' TTCN_PARALLEL TTCN_MATCHING TTCN_DEBUG' +
      ' EXECUTOR ERROR WARNING PORTEVENT TIMEROP' +
      ' VERDICTOP DEFAULTOP TESTCASE ACTION USER' +
      ' FUNCTION STATISTICS PARALLEL MATCHING DEBUG' +
      ' LOG_ALL LOG_NOTHING ACTION_UNQUALIFIED' +
      ' DEBUG_ENCDEC DEBUG_TESTPORT' +
      ' DEBUG_UNQUALIFIED DEFAULTOP_ACTIVATE' +
      ' DEFAULTOP_DEACTIVATE DEFAULTOP_EXIT' +
      ' DEFAULTOP_UNQUALIFIED ERROR_UNQUALIFIED' +
      ' EXECUTOR_COMPONENT EXECUTOR_CONFIGDATA' +
      ' EXECUTOR_EXTCOMMAND EXECUTOR_LOGOPTIONS' +
      ' EXECUTOR_RUNTIME EXECUTOR_UNQUALIFIED' +
      ' FUNCTION_RND FUNCTION_UNQUALIFIED' +
      ' MATCHING_DONE MATCHING_MCSUCCESS' +
      ' MATCHING_MCUNSUCC MATCHING_MMSUCCESS' +
      ' MATCHING_MMUNSUCC MATCHING_PCSUCCESS' +
      ' MATCHING_PCUNSUCC MATCHING_PMSUCCESS' +
      ' MATCHING_PMUNSUCC MATCHING_PROBLEM' +
      ' MATCHING_TIMEOUT MATCHING_UNQUALIFIED' +
      ' PARALLEL_PORTCONN PARALLEL_PORTMAP' +
      ' PARALLEL_PTC PARALLEL_UNQUALIFIED' +
      ' PORTEVENT_DUALRECV PORTEVENT_DUALSEND' +
      ' PORTEVENT_MCRECV PORTEVENT_MCSEND' +
      ' PORTEVENT_MMRECV PORTEVENT_MMSEND' +
      ' PORTEVENT_MQUEUE PORTEVENT_PCIN' +
      ' PORTEVENT_PCOUT PORTEVENT_PMIN' +
      ' PORTEVENT_PMOUT PORTEVENT_PQUEUE' +
      ' PORTEVENT_STATE PORTEVENT_UNQUALIFIED' +
      ' STATISTICS_UNQUALIFIED STATISTICS_VERDICT' +
      ' TESTCASE_FINISH TESTCASE_START' +
      ' TESTCASE_UNQUALIFIED TIMEROP_GUARD' +
      ' TIMEROP_READ TIMEROP_START TIMEROP_STOP' +
      ' TIMEROP_TIMEOUT TIMEROP_UNQUALIFIED' +
      ' USER_UNQUALIFIED VERDICTOP_FINAL' +
      ' VERDICTOP_GETVERDICT VERDICTOP_SETVERDICT' +
      ' VERDICTOP_UNQUALIFIED WARNING_UNQUALIFIED',
  ),
  externalCommands: words(
    'BeginControlPart EndControlPart BeginTestCase' + ' EndTestCase',
  ),
  multiLineStrings: true,
};

const keywords = parserConfig.keywords;
const fileNCtrlMaskOptions = parserConfig.fileNCtrlMaskOptions;
const externalCommands = parserConfig.externalCommands;
const multiLineStrings = parserConfig.multiLineStrings;
const indentStatements = parserConfig.indentStatements !== false;
const isOperatorChar = /[\|]/;
let curPunc;

function tokenBase(stream, state) {
  const ch = stream.next();
  if (ch == '"' || ch == "'") {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }
  if (/[:=]/.test(ch)) {
    curPunc = ch;
    return 'punctuation';
  }
  if (ch == '#') {
    stream.skipToEnd();
    return 'comment';
  }
  if (/\d/.test(ch)) {
    stream.eatWhile(/[\w\.]/);
    return 'number';
  }
  if (isOperatorChar.test(ch)) {
    stream.eatWhile(isOperatorChar);
    return 'operator';
  }
  if (ch == '[') {
    stream.eatWhile(/[\w_\]]/);
    return 'number';
  }

  stream.eatWhile(/[\w\$_]/);
  const cur = stream.current();
  if (keywords.propertyIsEnumerable(cur)) return 'keyword';
  if (fileNCtrlMaskOptions.propertyIsEnumerable(cur)) return 'atom';
  if (externalCommands.propertyIsEnumerable(cur)) return 'deleted';

  return 'variable';
}

function tokenString(quote) {
  return function (stream, state) {
    let escaped = false;
    let next;
    let end = false;
    while ((next = stream.next()) != null) {
      if (next == quote && !escaped) {
        let afterNext = stream.peek();
        //look if the character if the quote is like the B in '10100010'B
        if (afterNext) {
          afterNext = afterNext.toLowerCase();
          if (afterNext == 'b' || afterNext == 'h' || afterNext == 'o')
            stream.next();
        }
        end = true;
        break;
      }
      escaped = !escaped && next == '\\';
    }
    if (end || !(escaped || multiLineStrings)) state.tokenize = null;
    return 'string';
  };
}

function Context(indented, column, type, align, prev) {
  this.indented = indented;
  this.column = column;
  this.type = type;
  this.align = align;
  this.prev = prev;
}
function pushContext(state, col, type) {
  let indent = state.indented;
  if (state.context && state.context.type == 'statement')
    indent = state.context.indented;
  return (state.context = new Context(indent, col, type, null, state.context));
}
function popContext(state) {
  const t = state.context.type;
  if (t == ')' || t == ']' || t == '}') state.indented = state.context.indented;
  return (state.context = state.context.prev);
}

//Interface
export const ttcnCfg = {
  name: 'ttcn',
  startState: function () {
    return {
      tokenize: null,
      context: new Context(0, 0, 'top', false),
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
    if (style == 'comment') return style;
    if (ctx.align == null) ctx.align = true;

    if (
      (curPunc == ';' || curPunc == ':' || curPunc == ',') &&
      ctx.type == 'statement'
    ) {
      popContext(state);
    } else if (curPunc == '{') pushContext(state, stream.column(), '}');
    else if (curPunc == '[') pushContext(state, stream.column(), ']');
    else if (curPunc == '(') pushContext(state, stream.column(), ')');
    else if (curPunc == '}') {
      while (ctx.type == 'statement') ctx = popContext(state);
      if (ctx.type == '}') ctx = popContext(state);
      while (ctx.type == 'statement') ctx = popContext(state);
    } else if (curPunc == ctx.type) popContext(state);
    else if (
      indentStatements &&
      (((ctx.type == '}' || ctx.type == 'top') && curPunc != ';') ||
        (ctx.type == 'statement' && curPunc == 'newstatement'))
    )
      pushContext(state, stream.column(), 'statement');
    state.startOfLine = false;
    return style;
  },

  languageData: {
    indentOnInput: /^\s*[{}]$/,
    commentTokens: { line: '#' },
  },
};