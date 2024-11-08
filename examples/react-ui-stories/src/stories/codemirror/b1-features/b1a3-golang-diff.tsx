import React, { useEffect, useRef, useState } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { go } from '@codemirror/lang-go';
import { animatableDiffView } from '@codemirror/merge';
import { animatableDiffViewCompartment } from '@codemirror/merge/src/diff-actions';
import {
  Compartment,
  type ChangeSpec,
  type StateEffect,
} from '@codemirror/state';

const docGo = `func binarySearch(arr []int, target int) int {
  left, right := 0, len(arr)-1

  for left <= right {
    mid := (left + right) / 2
    midValue := arr[mid]
    if midValue == target {
      return mid
    } else if midValue < target {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // not found
  return -1
}`;
const docGo1 = `func binarySearch(arr []int, target int) int {
  left, right := 0, len(arr)-1

  for left <= right {
    mid := (left + right) / 2
    midValue := arr[mid]
    if midValue == target {
      // find the value
      return mid
    } else if midValue < target {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return -1
}`;
const docGo12 = `package crdt

import "fmt"

type CRDT interface {
  Insert(position int, value string) (string, error)d
  Delete(position int) string
}

func IsCRDT(c CRDT) {
  // temporary code to check if the CRDT wordddks.
  fmt.Println(c.Insert(1, "ddddddddddd dd  d  dd dd dd a"))
}
`;

type DiffViewConfig = {
  enableDiff: boolean;
  showTypewriterAnimation: boolean;
  showGutter: boolean;
  enableHighlightChanges: boolean;
  showMergeControls: boolean;
};

const initialDiffViewConfig = {
  enableDiff: true,
  showTypewriterAnimation: false,
  showGutter: true,
  enableHighlightChanges: false,
  showMergeControls: false,
};

// const animatableDiffViewCompartment = new Compartment();
const golangHighlightCompartment = new Compartment();

const maxHeightEditor = EditorView.theme({
  '&': {
    width: '70vw',
    maxHeight: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

/**
 * ❓ 被删除的行没有语法高亮
 *
 * ✨ 首次渲染后通过effects添加语法高亮
 */
export const GolangDiff = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [enableHighlight, setEnableHighlight] = useState(false);
  const [diffViewConfig, setDiffViewConfig] = useState<DiffViewConfig>(
    initialDiffViewConfig,
  );

  useEffect(() => {
    console.log(';; highlight ', enableHighlight, go());
    if (enableHighlight) {
      window['edd']?.dispatch({
        // effects: golangHighlightCompartment.reconfigure([go()]), // works too
        effects: golangHighlightCompartment.reconfigure(go()),
      });
    } else {
      window['edd']?.dispatch({
        effects: golangHighlightCompartment.reconfigure([]),
      });
    }
  }, [enableHighlight]);

  useEffect(() => {
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // maxHeightEditor,
        golangHighlightCompartment.of([]),
        animatableDiffViewCompartment.of(
          initialDiffViewConfig.enableDiff
            ? animatableDiffView({
                original: docGo,
                gutter: initialDiffViewConfig.showGutter,
                showTypewriterAnimation:
                  initialDiffViewConfig.showTypewriterAnimation,
                highlightChanges: initialDiffViewConfig.enableHighlightChanges,
                syntaxHighlightDeletions: true,
                mergeControls: initialDiffViewConfig.showMergeControls,
              })
            : [],
        ),
      ],
      doc: docGo1,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  useEffect(() => {
    const effects: StateEffect<any>[] = [];
    // const changes: ChangeSpec[] = [];
    effects.push(
      animatableDiffViewCompartment.reconfigure(
        diffViewConfig?.enableDiff
          ? animatableDiffView({
              original: docGo,
              gutter: diffViewConfig.showGutter,
              showTypewriterAnimation: diffViewConfig.showTypewriterAnimation,
              highlightChanges: diffViewConfig.enableHighlightChanges,
              syntaxHighlightDeletions: true,
              mergeControls: diffViewConfig.showMergeControls,
            })
          : [],
      ),
    );
    window['edd']?.dispatch({
      effects: effects,
      // changes: changes,
    });
  }, [diffViewConfig]);

  // console.log(';; render-config ', diffViewConfig);

  return (
    <div className='idCMEditor' style={{}}>
      <div className='configToolbar' style={{ display: 'flex', gap: '10px' }}>
        <div>
          <input
            id='syntaxHighlight'
            type='checkbox'
            checked={Boolean(enableHighlight)}
            onChange={(evt) => setEnableHighlight((v) => !v)}
          />
          <label htmlFor='EnableDiff'>syntax highlight</label>
        </div>
        <div>
          <input
            id='EnableDiff'
            type='checkbox'
            checked={Boolean(diffViewConfig.enableDiff)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                enableDiff: evt.target.checked,
              })
            }
          />
          <label htmlFor='EnableDiff'>Enable Diff</label>
        </div>
        <div>
          <input
            id='MergeViewGutter'
            type='checkbox'
            checked={Boolean(diffViewConfig.showGutter)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                showGutter: evt.target.checked,
              })
            }
          />
          <label htmlFor='MergeViewGutter'>Gutter</label>
        </div>
        {diffViewConfig.showTypewriterAnimation ? null : (
          <div>
            <input
              id='MergeViewHighlightChanges'
              type='checkbox'
              checked={Boolean(diffViewConfig.enableHighlightChanges)}
              onChange={(evt) =>
                setDiffViewConfig({
                  ...diffViewConfig,
                  enableHighlightChanges: evt.target.checked,
                })
              }
            />
            <label htmlFor='MergeViewHighlightChanges'>Highlight Changes</label>
          </div>
        )}
        <div>
          <input
            id='typewriterAnimation'
            type='checkbox'
            checked={Boolean(diffViewConfig.showTypewriterAnimation)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                showTypewriterAnimation: evt.target.checked,
              })
            }
          />
          <label htmlFor='typewriterAnimation'>Typewriter</label>
        </div>
      </div>
      <div ref={editorRef} />
    </div>
  );
};
