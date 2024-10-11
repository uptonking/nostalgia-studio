import { getChunks, rejectChunk, animatableDiffView } from '@codemirror/merge';
import {
  EditorState,
  type Extension,
  Prec,
  type StateEffect,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
  keymap,
} from '@codemirror/view';

import {
  ICON_CLOSE,
  ICON_ERROR,
  ICON_LOADING,
  ICON_PROMPT,
  ICON_SEND,
  ICON_STOP,
} from './icons-svg';
import { promptInputTheme } from './styling-theme';
import type { ChatReq, ChatRes, InputWidgetOptions, Pos } from './types';
import {
  cmdkRedo,
  cmdkUndo,
  getRefContent,
  isCmdkDiffViewActive,
  isPromptInputActive,
  PROMPT_PLACEHOLDER_ERROR,
  PROMPT_PLACEHOLDER_NORMAL,
  PROMPT_TIPS_NORMAL,
  PROMPT_TIPS_REQUESTING,
} from './utils';
import {
  inputWidgetPluginCompartment,
  cmdkDiffViewCompartment,
  showCmdkDiffView,
  hideCmdkDiffView,
  enableUndoCmdkTwice,
  setIsDocUpdatedBeforeShowDiff,
  hideCmdkInput,
  showCmdkInput,
} from './cmdk-actions';
import { cmdkDiffState, enableUndoRedoTwiceState } from './cmdk-diff-state';
import { cmdkInputState } from './cmdk-input-state';

/**
 * show the input widget
 */
export function activePromptInput(
  view: EditorView,
  defPrompt = '',
  /**  where is this method called from */
  source: 'hotkey' | 'toolbarButton' = 'hotkey',
  pos?: Pos,
) {
  if (isCmdkDiffViewActive(view.state)) {
    rejectChunks(view);
  }

  // update the selection pos
  let { from, to } = view.state.selection.main;
  if (pos) {
    // the pos comes from external (for example, toolbar button)
    from = pos.from;
    to = pos.to;
  }

  const line = view.state.doc.lineAt(from);
  if (line.from === 0) {
    // a hack to insert a new line at the beginning of the doc,
    // to avoid the prompt input widget render issue at the beginning
    view.dispatch({
      changes: { from: 0, insert: '\n' },
      selection: {
        anchor: from + 1,
        head: to + 1,
      },
    });
  } else {
    view.dispatch({
      selection: {
        anchor: from,
        head: to,
      },
    });
  }

  if (isPromptInputActive(view.state)) {
    view.dispatch({
      effects: hideCmdkInput.of({ showCmdkInputCard: false }),
    });
  }
  view.dispatch({
    effects: showCmdkInput.of({ showCmdkInputCard: true }),
  });

  const { onEvent } = inputWidgetOptions;
  onEvent?.(view, 'widget.open', { source });
}

function unloadPromptPlugins(view: EditorView) {
  view.dispatch({
    effects: [
      hideCmdkDiffView.of({
        showCmdkDiff: false,
      }),
      // cmdkDiffViewCompartment.reconfigure([]),
      // inputWidgetPluginCompartment.reconfigure([]),
      hideCmdkInput.of({ showCmdkInputCard: false }),
    ],
  });
}

export function replaceSelectedLines(
  view: EditorView,
  pos: Pos,
  content: string,
) {
  const oriDoc = view.state.doc.toString();

  const lineStart = view.state.doc.lineAt(pos.from);
  const lineEnd = view.state.doc.lineAt(pos.to);
  view.dispatch({
    changes: { from: lineStart.from, to: lineEnd.to, insert: content },
    selection: {
      anchor: lineStart.from,
    },
    effects: [setIsDocUpdatedBeforeShowDiff.of(true)],
    // userEvent: 'ai.replace',
    // annotations: cmdkReplaceAnno.of('cmdkReplaceAnno'),
  });

  view.dispatch({
    effects: [
      showCmdkDiffView.of({
        showCmdkDiff: true,
        originalContent: oriDoc,
        showTypewriterAnimation: true,
      }),
      // cmdkDiffViewCompartment.reconfigure(
      //   animatableDiffView({
      //     original: oriDoc,
      //     showTypewriterAnimation: true,
      //     gutter: false,
      //     highlightChanges: false,
      //     syntaxHighlightDeletions: true,
      //     mergeControls: false,
      //   }),
      // ),
    ],
  });
}

function rejectChunks(view: EditorView) {
  const chunks = getChunks(view.state)?.chunks || [];
  // must traverse from the last to the first
  for (let i = chunks.length - 1; i >= 0; i--) {
    // rejectChunk(view, chunks[i].fromB, false)
    rejectChunk(view, chunks[i].fromB);
  }
}

// recover the previous selection when widget dismiss or regenerate
function recoverSelection(view: EditorView, pos: Pos) {
  const { from, to } = pos;

  view.dispatch({
    selection: {
      anchor: from,
      head: to,
    },
  });
}

function moveCursorAfterAccept(view: EditorView) {
  const { to } = view.state.selection.main;
  view.dispatch({ selection: { anchor: to, head: to } });
}

type PromptInputStatus = 'normal' | 'requesting' | 'req_success' | 'req_error';

class PromptInputWidget extends WidgetType {
  private status: PromptInputStatus = 'normal';
  private inputPrompt: string = '';

  private chatId: string = '';
  private chatReq: ChatReq | null = null;
  private chatRes: ChatRes | null = null;

  constructor(
    /** pos is the selection when the widget is created */
    public oriSelPos: Pos,
    public defPrompt: string,
    public immediate: boolean,
  ) {
    super();
  }

  /** dismiss the prompt input widget by click `close` icon, or press `ESC` */
  dismiss(view: EditorView, by: 'icon' | 'esc_key' = 'icon'): void {
    const { cancelChat = () => {}, onEvent } = inputWidgetOptions;

    onEvent?.(view, 'close', { by });

    // chat maybe canceled before close
    if (this.chatId) {
      cancelChat(this.chatId);
    }

    if (isCmdkDiffViewActive(view.state)) {
      rejectChunks(view);
      recoverSelection(view, this.oriSelPos);
    }

    unloadPromptPlugins(view);
    view.focus();
  }

  toDOM(view: EditorView) {
    const root = document.createElement('div');
    root.className = 'cm-ai-prompt-input-root';
    root.innerHTML = `
      <form>
        <span class="cm-ai-prompt-input-icon cm-ai-prompt-input-icon-left">
          ${ICON_PROMPT}
        </span>
        <input class="prompt-input-box" placeholder="${inputWidgetOptions.promptInputPlaceholderNormal ?? PROMPT_PLACEHOLDER_NORMAL}" value="${this.defPrompt}" />
        <button class="cm-ai-prompt-input-icon cm-ai-prompt-input-icon-right">
          ${ICON_SEND}
        </button>
        <button class="cm-ai-prompt-input-icon cm-ai-prompt-input-icon-close">
          ${ICON_CLOSE}
        </button>
      </form>
      <span class="cm-ai-prompt-input-tips">${inputWidgetOptions.promptInputTipsNormal ?? PROMPT_TIPS_NORMAL}</span>
      <div class="cm-ai-prompt-input-actions">
        <button id="cm-ai-prompt-btn-accept">Accept</button>
        <button id="cm-ai-prompt-btn-discard">Discard</button>
       <!-- <button id="cm-ai-prompt-btn-gen">Regenerate</button>  -->
      </div>
    `;

    const form = root.querySelector('form') as HTMLFormElement;
    const input = form.querySelector('.prompt-input-box') as HTMLInputElement;
    const leftIcon = form.querySelector(
      'span.cm-ai-prompt-input-icon-left',
    ) as HTMLSpanElement;
    const rightIcon = form.querySelector(
      'button.cm-ai-prompt-input-icon-right',
    ) as HTMLButtonElement;
    const closeIcon = root.querySelector(
      'button.cm-ai-prompt-input-icon-close',
    ) as HTMLButtonElement;
    const tips = root.querySelector(
      'span.cm-ai-prompt-input-tips',
    ) as HTMLSpanElement;
    const actionBtns = root.querySelector(
      'div.cm-ai-prompt-input-actions',
    ) as HTMLDivElement;
    const acceptBtn = root.querySelector(
      'button#cm-ai-prompt-btn-accept',
    ) as HTMLButtonElement;
    const discardBtn = root.querySelector(
      'button#cm-ai-prompt-btn-discard',
    ) as HTMLButtonElement;
    // const regenBtn = root.querySelector(
    //   'button#cm-ai-prompt-btn-gen',
    // ) as HTMLButtonElement;

    // normal status is the initial status
    const normalStatus = () => {
      leftIcon.innerHTML = ICON_PROMPT;
      leftIcon.classList.remove('rotate');

      rightIcon.innerHTML = ICON_SEND;

      input.value = this.defPrompt;
      input.placeholder =
        inputWidgetOptions.promptInputPlaceholderNormal ??
        PROMPT_PLACEHOLDER_NORMAL;

      tips.style.display = 'flex';
      tips.innerText =
        inputWidgetOptions.promptInputTipsNormal ?? PROMPT_TIPS_NORMAL;

      actionBtns.style.display = 'none';

      this.status = 'normal';
    };
    const requestingStatus = () => {
      normalStatus();

      leftIcon.innerHTML = ICON_LOADING;
      leftIcon.classList.add('rotate');

      rightIcon.innerHTML = ICON_STOP;

      input.value = this.inputPrompt;

      tips.innerText =
        inputWidgetOptions.promptInputTipsRequesting ?? PROMPT_TIPS_REQUESTING;

      this.status = 'requesting';
    };
    const reqSuccessStatus = () => {
      normalStatus();

      input.value = this.inputPrompt;

      tips.style.display = 'none';

      actionBtns.style.display = 'flex';

      this.status = 'req_success';
    };
    const reqErrorStatus = (msg: string) => {
      normalStatus();

      leftIcon.innerHTML = ICON_ERROR;

      input.value = '';
      input.placeholder =
        msg ??
        inputWidgetOptions.promptInputPlaceholderError ??
        PROMPT_PLACEHOLDER_ERROR;

      tips.style.display = 'none';

      actionBtns.style.display = 'flex';
      acceptBtn.style.display = 'none';
      discardBtn.style.display = 'none';

      this.status = 'req_error';
    };
    // const noAgentConnStatus = () => {
    //   reqErrorStatus('failed to connect to agent');

    //   genBtn.style.display = 'none';
    //   addUseBtn.style.display = 'initial';

    //   this.status = 'no_agent_conn_error';
    // };

    const { chat, cancelChat, onEvent } = inputWidgetOptions;

    const handleRequest = async () => {
      if (this.status === 'requesting') {
        return;
      }

      if (isCmdkDiffViewActive(view.state)) {
        rejectChunks(view);
        recoverSelection(view, this.oriSelPos);
      }

      requestingStatus();

      const refContent = getRefContent(view, this.oriSelPos);
      this.chatId = crypto.randomUUID();
      this.chatReq = {
        prompt: this.inputPrompt,
        refContent,
        extra: {},
      };
      onEvent?.(view, 'req.send', { chatReq: this.chatReq });
      const start = performance.now();
      const res = await chat(view, this.chatId, this.chatReq);
      // this request maybe canceled before returning
      if (this.chatId === '') {
        return;
      }
      const duration = performance.now() - start;
      this.chatRes = res;

      if (res.status === 'success') {
        // replaceSelection(view, this.oriSelPos, res.message);
        replaceSelectedLines(view, this.oriSelPos, res.message);
        reqSuccessStatus();
      } else if (res.status === 'error') {
        reqErrorStatus(res.message);
      }
      onEvent?.(view, `req.${res.status}`, {
        chatReq: this.chatReq,
        chatRes: this.chatRes,
        duration,
      });
    };

    root.onclick = (e) => {
      e.preventDefault();
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      this.inputPrompt = input.value.trim();
      if (this.inputPrompt.length === 0) {
        return;
      }
      await handleRequest();
    };
    input.onkeydown = (e) => {
      console.log(';; keydown in input ', this.oriSelPos);
      if (
        e.key === 'z' &&
        (e.ctrlKey || e.metaKey) &&
        input.value === ''
      ) {
        view.dispatch({
          effects: hideCmdkInput.of({ showCmdkInputCard: false }),
        });
        queueMicrotask(() => recoverSelection(view, this.oriSelPos));
      }
    };
    rightIcon.onclick = () => {
      // if (!getCurDatabase(view.state)) {
      //   noUseStatus();
      //   return;
      // }

      if (this.status === 'requesting') {
        onEvent?.(view, 'req.cancel', { chatReq: this.chatReq });
        rejectChunks(view);

        cancelChat(this.chatId);
        normalStatus();
        recoverSelection(view, this.oriSelPos);

        this.chatId = '';
        this.chatRes = null;
      } else {
        form.requestSubmit();
      }
    };
    closeIcon.onclick = () => {
      this.dismiss(view);
    };
    acceptBtn.onclick = () => {
      onEvent?.(view, 'accept.click', {
        chatReq: this.chatReq,
        chatRes: this.chatRes,
      });
      unloadPromptPlugins(view);

      moveCursorAfterAccept(view);
      view.focus();
    };
    discardBtn.onclick = () => {
      onEvent?.(view, 'discard.click', {
        chatReq: this.chatReq,
        chatRes: this.chatRes,
      });
      rejectChunks(view);
      recoverSelection(view, this.oriSelPos);
      unloadPromptPlugins(view);
      view.focus();
    };
    // regenBtn.onclick = async () => {
    //   onEvent?.(view, 'gen.click', {
    //     chatReq: this.chatReq,
    //     chatRes: this.chatRes,
    //   });
    //   await handleRequest();
    // };

    // todo fix hack
    setTimeout(() => {
      const end = input.value.length;
      input.setSelectionRange(end, end);
      input.focus();

      // if (!getCurDatabase(view.state)) {
      //   onEvent?.(view, 'no_ai.error');
      //   noUseAiStatus();
      //   return;
      // }

      if (this.immediate && !this.chatReq) {
        form.requestSubmit();
        return;
      }

      // recover widget status when the widget is re-render, aka, toDOM is re-run
      if (this.status === 'normal') {
        normalStatus();
      } else if (this.status === 'requesting') {
        requestingStatus();
      } else if (this.status === 'req_success') {
        reqSuccessStatus();
      } else if (this.status === 'req_error') {
        reqErrorStatus(this.chatRes!.message);
      }
    }, 100);

    return root;
  }

  ignoreEvent() {
    // when true, widget handles events by widget itself and stop propagation
    // when false, let inputPlugin to handle events in the `eventHandlers`
    return true;
  }

  destroy(_dom: HTMLElement): void {
    _dom?.remove();
  }
}

// todo rewrite with state field
const inputPlugin = (defPrompt: string, immediate: boolean) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      promptInputWidget: PromptInputWidget;

      constructor(public view: EditorView) {
        const { from, to } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        // show the widget before the selection head
        const pos = line.from - 1;
        if (pos < 0) {
          throw new Error('pos < 0');
        }

        this.promptInputWidget = new PromptInputWidget(
          { from, to },
          defPrompt,
          immediate,
        );
        this.decorations = Decoration.set([
          Decoration.widget({
            widget: this.promptInputWidget,
            side: 1,
            // block: true, // totally doesn't work
          }).range(pos),
        ]);

        document.addEventListener(
          'dismiss_ai_widget',
          this.dismissEventListener,
        );
      }

      update(v: ViewUpdate) {
        // update the decoration pos if content changes
        // for example: after clicking button to insert new content before the widget
        this.decorations = this.decorations.map(v.changes);
      }

      dismissEventListener = (e: Event) => {
        const source = (e as CustomEvent).detail.source;
        this.promptInputWidget.dismiss(this.view, source);
      };

      destroy() {
        document.removeEventListener(
          'dismiss_ai_widget',
          this.dismissEventListener,
        );
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );

const promptInputKeyMaps = (hotkey?: string) =>
  Prec.high(
    keymap.of([
      {
        key: hotkey || 'Mod-k',
        run: (view) => {
          activePromptInput(view);
          // return true to prevent propagation
          return true;
        },
      },
    ]),
  );

const cmdkInputRender = () => {
  return EditorState.transactionExtender.of((tr) => {
    const cmdkInputStateBefore = tr.startState.field(cmdkInputState);
    const cmdkInputStateAfter = tr.state.field(cmdkInputState);
    console.log(
      ';; renderCmdkInput ',
      cmdkInputStateAfter.showCmdkInputCard,
      cmdkInputStateBefore,
      cmdkInputStateAfter,
      tr,
    );

    if (
      cmdkInputStateBefore.showCmdkInputCard !==
      cmdkInputStateAfter.showCmdkInputCard
    ) {
      if (cmdkInputStateAfter.showCmdkInputCard) {
        return {
          effects: inputWidgetPluginCompartment.reconfigure(
            inputPlugin('', false),
          ),
        };
      }

      return {
        effects: [inputWidgetPluginCompartment.reconfigure([])],
      };
    }
  });
};

const cmdkDiffViewRender = () => {
  return EditorState.transactionExtender.of((tr) => {
    const cmdkDiffStateBefore = tr.startState.field(cmdkDiffState);
    const cmdkDiffStateAfter = tr.state.field(cmdkDiffState);

    if (
      cmdkDiffStateBefore.isDocUpdatedBeforeShowDiff !==
      cmdkDiffStateAfter.isDocUpdatedBeforeShowDiff
    ) {
      if (
        tr.isUserEvent('redo') &&
        cmdkDiffStateAfter.isDocUpdatedBeforeShowDiff
      ) {
        return {
          effects: [enableUndoCmdkTwice.of(true)],
        };
      }
    }

    if (cmdkDiffStateBefore.showCmdkDiff !== cmdkDiffStateAfter.showCmdkDiff) {
      console.log(
        ';; renderCmdkDiff ',
        cmdkDiffStateAfter.showCmdkDiff,
        cmdkDiffStateBefore,
        cmdkDiffStateAfter,
        tr,
      );

      if (cmdkDiffStateAfter.showCmdkDiff) {
        const effectsWithShowDiff: Array<StateEffect<unknown>> = [
          cmdkDiffViewCompartment.reconfigure(
            animatableDiffView({
              original: cmdkDiffStateAfter.originalContent,
              showTypewriterAnimation: Boolean(
                cmdkDiffStateAfter.showTypewriterAnimation,
              ),
              gutter: false,
              highlightChanges: false,
              syntaxHighlightDeletions: true,
              mergeControls: false,
            }),
          ),
        ];

        return {
          effects: effectsWithShowDiff,
        };
      }

      if (tr.isUserEvent('undo') && !cmdkDiffStateAfter.showCmdkDiff) {
        return {
          effects: [
            cmdkDiffViewCompartment.reconfigure([]),
            enableUndoCmdkTwice.of(true),
          ],
        };
      }

      return {
        effects: [cmdkDiffViewCompartment.reconfigure([])],
      };
    }
  });
};

export const cmdkUndoRedoHotkeys = () => {
  return [
    Prec.high(
      keymap.of([
        {
          key: 'Mod-z',
          run: cmdkUndo,
        },
      ]),
    ),
    Prec.high(
      keymap.of([
        {
          key: 'Mod-y',
          mac: 'Mod-Shift-z',
          run: cmdkRedo,
        },
      ]),
    ),
    Prec.high(
      keymap.of([
        {
          linux: 'Ctrl-Shift-z',
          run: cmdkRedo,
        },
      ]),
    ),
  ];
};

/** update input box style when ai is coding */
// const inputListener = EditorView.inputHandler.of((update) => {
//   if (isPromptInputActive(update.state)) {
//     const inputEle = document.querySelector('.cm-ai-prompt-input-root');
//     if (inputEle) {
//       inputEle.classList.add('shake');

//       setTimeout(() => {
//         inputEle.classList.remove('shake');
//       }, 1000);
//     }
//   }
//   return false;
// });

let inputWidgetOptions: InputWidgetOptions;

export function getAiWidgetOptions() {
  return inputWidgetOptions;
}

export function aiPromptInput(options: InputWidgetOptions): Extension {
  inputWidgetOptions = options;

  return [
    promptInputTheme,
    inputWidgetPluginCompartment.of([]),
    cmdkDiffViewCompartment.of([]),
    cmdkInputRender(),
    cmdkDiffViewRender(),
    promptInputKeyMaps(options.hotkey),
    cmdkUndoRedoHotkeys(),
    // inputListener,
  ];
}
