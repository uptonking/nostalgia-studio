import { parser } from '@lezer/xml';
import type { SyntaxNode } from '@lezer/common';
import {
  indentNodeProp,
  foldNodeProp,
  LRLanguage,
  LanguageSupport,
  bracketMatchingHandle,
  syntaxTree,
} from '@codemirror/language';
import { EditorSelection, type Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  type ElementSpec,
  type AttrSpec,
  completeFromSchema,
} from './complete';
export { completeFromSchema };
export type { ElementSpec, AttrSpec };

/// A language provider based on the [Lezer XML
/// parser](https://github.com/lezer-parser/xml), extended with
/// highlighting and indentation information.
export const xmlLanguage = LRLanguage.define({
  name: 'xml',
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Element(context) {
          const closed = /^\s*<\//.test(context.textAfter);
          return (
            context.lineIndent(context.node.from) + (closed ? 0 : context.unit)
          );
        },
        'OpenTag CloseTag SelfClosingTag'(context) {
          return context.column(context.node.from) + context.unit;
        },
      }),
      foldNodeProp.add({
        Element(subtree) {
          const first = subtree.firstChild;
          const last = subtree.lastChild!;
          if (!first || first.name != 'OpenTag') return null;
          return {
            from: first.to,
            to: last.name == 'CloseTag' ? last.from : subtree.to,
          };
        },
      }),
      bracketMatchingHandle.add({
        'OpenTag CloseTag': (node) => node.getChild('TagName'),
      }),
    ],
  }),
  languageData: {
    commentTokens: { block: { open: '<!--', close: '-->' } },
    indentOnInput: /^\s*<\/$/,
  },
});

type XMLConfig = {
  /// Provide a schema to create completions from.
  elements?: readonly ElementSpec[];
  /// Supporting attribute descriptions for the schema specified in
  /// [`elements`](#lang-xml.xml^conf.elements).
  attributes?: readonly AttrSpec[];
  /// Determines whether [`autoCloseTags`](#lang-xml.autoCloseTags)
  /// is included in the support extensions. Defaults to true.
  autoCloseTags?: boolean;
};

/// XML language support. Includes schema-based autocompletion when
/// configured.
export function xml(conf: XMLConfig = {}) {
  const support = [
    xmlLanguage.data.of({
      autocomplete: completeFromSchema(
        conf.elements || [],
        conf.attributes || [],
      ),
    }),
  ];
  if (conf.autoCloseTags !== false) support.push(autoCloseTags);
  return new LanguageSupport(xmlLanguage, support);
}

function elementName(
  doc: Text,
  tree: SyntaxNode | null | undefined,
  max = doc.length,
) {
  if (!tree) return '';
  const tag = tree.firstChild;
  const name = tag && tag.getChild('TagName');
  return name ? doc.sliceString(name.from, Math.min(name.to, max)) : '';
}

/// Extension that will automatically insert close tags when a `>` or
/// `/` is typed.
export const autoCloseTags = EditorView.inputHandler.of(
  (view, from, to, text, insertTransaction) => {
    if (
      view.composing ||
      view.state.readOnly ||
      from != to ||
      (text != '>' && text != '/') ||
      !xmlLanguage.isActiveAt(view.state, from, -1)
    )
      return false;
    const base = insertTransaction();
    const { state } = base;
    const closeTags = state.changeByRange((range) => {
      const { head } = range;
      const didType = state.doc.sliceString(head - 1, head) == text;
      const after = syntaxTree(state).resolveInner(head, -1);
      let name;
      if (didType && text == '>' && after.name == 'EndTag') {
        const tag = after.parent!;
        if (
          tag.parent?.lastChild?.name != 'CloseTag' &&
          (name = elementName(state.doc, tag.parent, head))
        ) {
          const to =
            head + (state.doc.sliceString(head, head + 1) === '>' ? 1 : 0);
          const insert = `</${name}>`;
          return { range, changes: { from: head, to, insert } };
        }
      } else if (didType && text == '/' && after.name == 'StartCloseTag') {
        const base = after.parent!;
        if (
          after.from == head - 2 &&
          base.lastChild?.name != 'CloseTag' &&
          (name = elementName(state.doc, base, head))
        ) {
          const to =
            head + (state.doc.sliceString(head, head + 1) === '>' ? 1 : 0);
          const insert = `${name}>`;
          return {
            range: EditorSelection.cursor(head + insert.length, -1),
            changes: { from: head, to, insert },
          };
        }
      }
      return { range };
    });
    if (closeTags.changes.empty) return false;
    view.dispatch([
      base,
      state.update(closeTags, {
        userEvent: 'input.complete',
        scrollIntoView: true,
      }),
    ]);
    return true;
  },
);
