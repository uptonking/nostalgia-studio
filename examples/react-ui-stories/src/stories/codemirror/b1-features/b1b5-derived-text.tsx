import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';

import { syntaxTree } from '@codemirror/language';
import {
  type EditorState,
  type Extension,
  StateField,
  Compartment,
  RangeSet,
} from '@codemirror/state';
import { Decoration, type DecorationSet, WidgetType } from '@codemirror/view';

// block widget builder
class TokenWidget extends WidgetType {
  constructor(readonly id: string) {
    super();
  }

  eq(other: TokenWidget) {
    return other.id === this.id;
  }

  toDOM() {
    const el = document.createElement('div');
    el.style.backgroundColor = '#f1f1f1';

    el.setAttribute('aria-hidden', 'true');
    el.innerText = `TOKEN ( ${this.id} )`;

    return el;
  }
}

const specialTokenRegex = /SPECIAL_TOKEN\((?<id>\d+)\)/;

const decorator = (state: EditorState) => {
  const decorations = [];

  syntaxTree(state).iterate({
    enter: ({ type, from, to }) => {
      if (type.name === 'Document') {
        return;
      }

      if (type.name === 'Paragraph') {
        const result = specialTokenRegex.exec(state.doc.sliceString(from, to));
        if (result && result.groups && result.groups.id) {
          // 👇 render widget before line start
          decorations.push(
            Decoration.widget({
              widget: new TokenWidget(result.groups.id),
              side: -1,
              block: true,
            }).range(state.doc.lineAt(from).from),
          );
        }
      }

      return false;
    },
  });

  return decorations.length > 0
    ? (RangeSet.of(decorations) as DecorationSet)
    : Decoration.none;
};

export const tokenExtension = (): Extension => {
  const customField = StateField.define<DecorationSet>({
    create(state) {
      return decorator(state);
    },
    update(customs, transaction) {
      if (transaction.docChanged) {
        return decorator(transaction.state);
      }

      return customs.map(transaction.changes);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [customField];
};

const initial = [
  '# Hello, World',
  '',
  'This is a SPECIAL_TOKEN(123).',
  '',
  'This is a SPECIAL_TOKEN(456).',
  '',
  'How are you doing?',
].join('\n');

/**
 * block widget has no line number
 * - Decoration.widget
 */
export const DerivedText = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        language.of(
          markdown(),
          // markdown({
          //   base: markdownLanguage,
          //   codeLanguages: languages
          // }),
        ),
        tokenExtension(),
      ],
      doc: initial,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
