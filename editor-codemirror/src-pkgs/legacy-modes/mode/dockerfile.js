import { simpleMode } from './simple-mode.js';

const from = 'from';
const fromRegex = new RegExp('^(\\s*)\\b(' + from + ')\\b', 'i');

const shells = ['run', 'cmd', 'entrypoint', 'shell'];
const shellsAsArrayRegex = new RegExp(
  '^(\\s*)(' + shells.join('|') + ')(\\s+\\[)',
  'i',
);

const expose = 'expose';
const exposeRegex = new RegExp('^(\\s*)(' + expose + ')(\\s+)', 'i');

const others = [
  'arg',
  'from',
  'maintainer',
  'label',
  'env',
  'add',
  'copy',
  'volume',
  'user',
  'workdir',
  'onbuild',
  'stopsignal',
  'healthcheck',
  'shell',
];

// Collect all Dockerfile directives
const instructions = [from, expose].concat(shells).concat(others);
  const instructionRegex = '(' + instructions.join('|') + ')';
  const instructionOnlyLine = new RegExp(
    '^(\\s*)' + instructionRegex + '(\\s*)(#.*)?$',
    'i',
  );
  const instructionWithArguments = new RegExp(
    '^(\\s*)' + instructionRegex + '(\\s+)',
    'i',
  );

export const dockerFile = simpleMode({
  start: [
    // Block comment: This is a line starting with a comment
    {
      regex: /^\s*#.*$/,
      sol: true,
      token: 'comment',
    },
    {
      regex: fromRegex,
      token: [null, 'keyword'],
      sol: true,
      next: 'from',
    },
    // Highlight an instruction without any arguments (for convenience)
    {
      regex: instructionOnlyLine,
      token: [null, 'keyword', null, 'error'],
      sol: true,
    },
    {
      regex: shellsAsArrayRegex,
      token: [null, 'keyword', null],
      sol: true,
      next: 'array',
    },
    {
      regex: exposeRegex,
      token: [null, 'keyword', null],
      sol: true,
      next: 'expose',
    },
    // Highlight an instruction followed by arguments
    {
      regex: instructionWithArguments,
      token: [null, 'keyword', null],
      sol: true,
      next: 'arguments',
    },
    {
      regex: /./,
      token: null,
    },
  ],
  from: [
    {
      regex: /\s*$/,
      token: null,
      next: 'start',
    },
    {
      // Line comment without instruction arguments is an error
      regex: /(\s*)(#.*)$/,
      token: [null, 'error'],
      next: 'start',
    },
    {
      regex: /(\s*\S+\s+)(as)/i,
      token: [null, 'keyword'],
      next: 'start',
    },
    // Fail safe return to start
    {
      token: null,
      next: 'start',
    },
  ],
  single: [
    {
      regex: /(?:[^\\']|\\.)/,
      token: 'string',
    },
    {
      regex: /'/,
      token: 'string',
      pop: true,
    },
  ],
  double: [
    {
      regex: /(?:[^\\"]|\\.)/,
      token: 'string',
    },
    {
      regex: /"/,
      token: 'string',
      pop: true,
    },
  ],
  array: [
    {
      regex: /\]/,
      token: null,
      next: 'start',
    },
    {
      regex: /"(?:[^\\"]|\\.)*"?/,
      token: 'string',
    },
  ],
  expose: [
    {
      regex: /\d+$/,
      token: 'number',
      next: 'start',
    },
    {
      regex: /[^\d]+$/,
      token: null,
      next: 'start',
    },
    {
      regex: /\d+/,
      token: 'number',
    },
    {
      regex: /[^\d]+/,
      token: null,
    },
    // Fail safe return to start
    {
      token: null,
      next: 'start',
    },
  ],
  arguments: [
    {
      regex: /^\s*#.*$/,
      sol: true,
      token: 'comment',
    },
    {
      regex: /"(?:[^\\"]|\\.)*"?$/,
      token: 'string',
      next: 'start',
    },
    {
      regex: /"/,
      token: 'string',
      push: 'double',
    },
    {
      regex: /'(?:[^\\']|\\.)*'?$/,
      token: 'string',
      next: 'start',
    },
    {
      regex: /'/,
      token: 'string',
      push: 'single',
    },
    {
      regex: /[^#"']+[\\`]$/,
      token: null,
    },
    {
      regex: /[^#"']+$/,
      token: null,
      next: 'start',
    },
    {
      regex: /[^#"']+/,
      token: null,
    },
    // Fail safe return to start
    {
      token: null,
      next: 'start',
    },
  ],
  languageData: {
    commentTokens: { line: '#' },
  },
});
