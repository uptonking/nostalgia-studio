import {
  LanguageSupport,
  LanguageDescription,
  type StreamParser,
  StreamLanguage,
} from '@codemirror/language';

/// An array of language descriptions for known language packages.
export const languages = [
  LanguageDescription.of({
    name: 'CSS',
    extensions: ['css'],
    load() {
      return import('@codemirror/lang-css').then((m) => m.css());
    },
  }),
  LanguageDescription.of({
    name: 'HTML',
    alias: ['xhtml'],
    extensions: ['html', 'htm', 'handlebars', 'hbs'],
    load() {
      return import('@codemirror/lang-html').then((m) => m.html());
    },
  }),
  LanguageDescription.of({
    name: 'JavaScript',
    alias: ['ecmascript', 'js', 'node'],
    extensions: ['js', 'mjs', 'cjs'],
    load() {
      return import('@codemirror/lang-javascript').then((m) => m.javascript());
    },
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    alias: ['ts'],
    extensions: ['ts', 'mts', 'cts'],
    load() {
      return import('@codemirror/lang-javascript').then((m) =>
        m.javascript({ typescript: true }),
      );
    },
  }),
  LanguageDescription.of({
    name: 'JSON',
    alias: ['json5'],
    extensions: ['json', 'map'],
    load() {
      return import('@codemirror/lang-json').then((m) => m.json());
    },
  }),
  LanguageDescription.of({
    name: 'JSX',
    extensions: ['jsx'],
    load() {
      return import('@codemirror/lang-javascript').then((m) =>
        m.javascript({ jsx: true }),
      );
    },
  }),
  LanguageDescription.of({
    name: 'TSX',
    extensions: ['tsx'],
    load() {
      return import('@codemirror/lang-javascript').then((m) =>
        m.javascript({ jsx: true, typescript: true }),
      );
    },
  }),
  LanguageDescription.of({
    name: 'Markdown',
    extensions: ['md', 'markdown', 'mkd'],
    load() {
      return import('@codemirror/lang-markdown').then((m) => m.markdown());
    },
  }),
  // LanguageDescription.of({
  //   name: 'SQL',
  //   extensions: ['sql'],
  //   load() {
  //     return sql('StandardSQL');
  //   },
  // }),
  LanguageDescription.of({
    name: 'XML',
    alias: ['rss', 'wsdl', 'xsd'],
    extensions: ['xml', 'xsl', 'xsd', 'svg'],
    load() {
      return import('@codemirror/lang-xml').then((m) => m.xml());
    },
  }),
];
