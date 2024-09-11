import React, { useEffect, useRef } from 'react';

import { minimalSetup, EditorView } from 'codemirror';

import {
  gutter as defineGutter,
  GutterMarker,
  ViewUpdate,
  Decoration,
  WidgetType,
} from '@codemirror/view';
import { EditorState, RangeSetBuilder, StateField } from '@codemirror/state';

function formatNumber(view, n) {
  return n.toString();
}
function maxLineNumber(lines) {
  let last = 9;
  while (last < lines) last = last * 10 + 9;
  return last;
}

class NumberMarker extends GutterMarker {
  declare n: any;

  constructor(n) {
    super();
    this.n = n;
  }
  eq(other) {
    return this.n === other.n;
  }

  toDOM() {
    return document.createTextNode(this.n);
  }
}

export class ExpandWidget extends WidgetType {
  constructor() {
    super();
  }
  eq(widget) {
    return true;
  }
  toDOM() {
    return document.createTextNode('widget here') as unknown as HTMLElement;
  }
}

export class ExpandMarker extends GutterMarker {
  declare direction: any;

  constructor(direction) {
    super();
    this.direction = direction;
  }

  eq(other) {
    return this.direction === other.direction;
  }

  toDOM() {
    // this should appear in the gutter next to ExpandWidget
    return document.createTextNode('m');
  }
}

const gutter = defineGutter({
  class: 'cm-lineNumbers',
  renderEmptyElements: false,
  lineMarker(view, line, others) {
    if (others.some((m) => m.toDOM)) {
      return null;
    }
    return new NumberMarker(
      formatNumber(view, view.state.doc.lineAt(line.from).number),
    );
  },
  lineMarkerChange: (update) => false,
  widgetMarker(view, widget, line) {
    // this does not get called at all
    // but I expect it to be called for replaced lines 1 and 2
    return new ExpandMarker('up');
  },
  initialSpacer(view) {
    return new NumberMarker(
      formatNumber(view, maxLineNumber(view.state.doc.lines)),
    );
  },
  updateSpacer(spacer, update) {
    const max = formatNumber(
      update.view,
      maxLineNumber(update.view.state.doc.lines),
    );
    // @ts-expect-error fix n
    return max === spacer.n ? spacer : new NumberMarker(max);
  },
});

const foldedLines = StateField.define({
  create(state) {
    const builder = new RangeSetBuilder();
    for (let i = 1; i <= 2; i++) {
      if (state.doc.lines < i) {
        break;
      }
      const line = state.doc.line(i);
      builder.add(
        line.from,
        line.to,
        Decoration.replace({
          block: true,
          widget: new ExpandWidget(),
        }),
      );
    }
    return builder.finish();
  },
  update(lines, transaction) {
    return lines.map(transaction.changes);
  },
  // @ts-expect-error  to fix types
  provide: (f) => EditorView.decorations.from(f),
});

// const content = `# CodeMirror v6

// This is an cm example at 20240806

// ## Lists

// - apple
// - banana
// - another fruit

// ## Links

// [Some Link](https://example.org)
// `;
export const GutterForBlockWidget = () => {
  const content = `<?php declare(strict_types = 1);

class HelloWorld
{
	public function sayHello(DateTimeImutable $date): void
	{
		echo 'Hello, ' . $date->format('j. n. Y');
	}
}`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        minimalSetup,
        // language.of(markdown())
        gutter,
        foldedLines,
      ],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
