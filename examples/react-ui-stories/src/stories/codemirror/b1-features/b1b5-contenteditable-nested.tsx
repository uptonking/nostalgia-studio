import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  Decoration,
  type DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import {
  EditorState,
  EditorSelection,
  StateField,
  type Transaction,
} from '@codemirror/state';

// Define a simple widget which contains a contenteditable div.
class EditableDivWidget extends WidgetType {
  constructor(readonly contents: string) {
    super();
  }

  toDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'editable-div';
    wrap.innerHTML = `<div contenteditable style='font-family: auto; white-space: normal; outline-width: 0px; color:coral'>${this.contents}</div>`;
    return wrap;
  }

  // ignoreEvent can be used to configure which kinds of events inside the widget 
  // should be ignored by the editor. The default is to ignore all events.
  // We want to handle all events for this widget.
  ignoreEvent(event: Event) {
    if (event.type === 'focusin') {
      return false;
    } else {
      return true;
    }
  }
}

// Define a state field to contain a DecorationSet of EditableDivWidgets.
const editableDivField = StateField.define<DecorationSet>({
  create(state: EditorState) {
    return Decoration.none;
  },

  update(editableDivs: DecorationSet, tr: Transaction) {
    return editableDivs.map(tr.changes);
  },

  provide: (field: StateField<DecorationSet>) =>
    EditorView.decorations.from(field),

  fromJSON: (json: any, state: EditorState) =>
    Decoration.set(
      json.map(([from, to, contents]: [number, number, string]) =>
        Decoration.replace({
          widget: new EditableDivWidget(contents),
          block: true,
        }).range(from, to),
      ),
    ),
});

// Define a simple view plugin to forward events correctly.
const testPlugin = ViewPlugin.fromClass(class {}, {
  eventHandlers: {
    focusin: (e: Event, view) => {
      console.log(e.type);
      console.log(e.target);
      if ((e.target as HTMLElement).closest('.editable-div') !== null) {
        console.log('Success! Handling focusin for contenteditable div.');
        return false;
      } else {
        console.log('Not our contenteditable div.');
        return false;
      }
    },
  },
});

// Follow the standard steps to create the CodeMirror editor. Use fromJSON to create
// a pre-loaded setup with our widget already embedded.
const state = EditorState.fromJSON(
  {
    doc: '\nChecking on focusin routing...',
    selection: EditorSelection.single(0).toJSON(),
    editable_div: [[0, 0, 'This text is inside nested contenteditable true']],
  },
  {
    extensions: [testPlugin, basicSetup],
  },
  {
    editable_div: editableDivField,
  },
);

export const ContenteditableNested = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = new EditorView({
      state,
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
