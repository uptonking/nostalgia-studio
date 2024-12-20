import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Compartment } from '@codemirror/state';
import { inputCardEmbedded } from '@datalking/cm-input-card-embedded';
import { floatingToolbar } from '@datalking/cm-floating-toolbar';
import { diffToolbar } from '../../../../../../editor-codemirror/src-pkgs/merge/src/diff-toolbar';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const cmdkInputCardExt = inputCardEmbedded({
  chat: async () => {
    await sleep(1000);
    return {
      status: 'success',
      message:
        '// ;;; AI CODED ' +
        Number(new Date()).toString(36).slice(-5) +
        '\n// replace mock data with your own api\n// ;;;',
    };
  },
});

export const CmdkInputCard = () => {
  const content = `# CodeMirror v6

Cmd+K is the shortcut for ai-assisted single file editing

## Lists

- apple
- banana
- another fruit


another fruit export const floatingToolbarState = StateField.define<readonly Tooltip[]>({


## Links

export const floatingToolbarState = StateField.define<readonly Tooltip[]>({

      (document.querySelector('.prompt-input-box') as HTMLInputElement)


[Some Link](https://example.org) 
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = new EditorView({
      extensions: [
        basicSetup,
        cmdkInputCardExt,
        floatingToolbar(),
        diffToolbar(),
        // language.of(markdown())
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
