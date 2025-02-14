import { redo, undo } from '@codemirror/commands';
import { animatableDiffView, getChunks, rejectChunk } from '@codemirror/merge';
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
  keymap,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view';

import {
  cmdkDiffViewCompartment,
  enableUndoCmdkTwice,
  hideCmdkDiffView,
  hideCmdkInput,
  inputWidgetPluginCompartment,
  setIsDocUpdatedBeforeShowDiff,
  setIsPromptInputFocused,
  setInputTriggerRange,
  setPromptText,
  showCmdkDiffView,
  showCmdkInput,
  setIsCmdkDiffRejected,
  enableRedoCmdkTwice,
  enableUndoCmdkThrice,
  enableRedoCmdkThrice,
  resetIsCmdkDiffRejected,
} from './cmdk-actions';
import {
  checkIsCmdkDiffVisibilityChanged,
  checkIsDocUpdatedBeforeShowDiffChanged,
  checkIsCmdkDiffRejectedChanged,
  cmdkDiffState,
} from './cmdk-diff-state';
import {
  checkIsCmdkInputVisibilityChanged,
  cmdkInputState,
} from './cmdk-input-state';
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
  acceptCmdkCode,
  cmdkRedo,
  cmdkUndo,
  getRefContent,
  isCmdkDiffViewActive,
  isPromptInputActive,
  PROMPT_PLACEHOLDER_ERROR,
  PROMPT_PLACEHOLDER_NORMAL,
  PROMPT_TIPS_NORMAL,
  PROMPT_TIPS_REQUESTING,
  queryMainElements,
  rejectCmdkCode,
} from './utils';

/**
 * show the input widget
 */
export function activePromptInput(
  view: EditorView,
  /**  where is this method called from */
  source: 'hotkey' | 'toolbar' = 'hotkey',
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

  const prevRangeStart = view.state.field(
    cmdkInputState,
    false,
  ).inputTriggerRange;
  console.log(
    ';; cmdk-sel ',
    view.state.doc.lineAt(view.state.selection.main.anchor).number,
    view.state.selection.main,
    prevRangeStart,
  );
  if (isPromptInputActive(view.state)) {
    if (
      view.state.doc.lineAt(view.state.selection.main.anchor).number ===
      view.state.doc.lineAt(prevRangeStart[0]).number
    ) {
      // /if selection start position is unchanged, it's unnecessary to rerender input
      return;
    }

    view.dispatch({
      effects: [hideCmdkInput.of({ showCmdkInputCard: false })],
    });
  }
  // console.log(';; cmdk-start-ing ');

  view.dispatch({
    effects: [
      setInputTriggerRange.of([
        [view.state.selection.main.from, view.state.selection.main.to],
        [-1e9, -1e9],
      ]),
      showCmdkInput.of({ showCmdkInputCard: true }),
      setIsPromptInputFocused.of(true),
      // setPromptText.of(['', view.state.field(cmdkInputState).prompt]),
    ],
  });

  const { onEvent } = inputWidgetOptions;
  onEvent?.(view, 'widget.open', { source });
}

function unloadPromptPlugins(
  view: EditorView,
  promptText?: [string, string],
  inputPos = -1e9,
) {
  const triggerRange = view.state.field(
    cmdkInputState,
    false,
  ).inputTriggerRange;
  // const showDiffView = view.state.field(cmdkDiffState, false).showCmdkDiff;

  view.dispatch({
    effects: [
      promptText ? setPromptText.of(promptText) : undefined,
      isCmdkDiffViewActive(view.state)
        ? hideCmdkDiffView.of({ showCmdkDiff: false })
        : undefined,
      isPromptInputActive(view.state)
        ? hideCmdkInput.of({ showCmdkInputCard: false })
        : undefined,
      isPromptInputActive(view.state)
        ? setInputTriggerRange.of([[inputPos, inputPos], triggerRange])
        : undefined,
    ].filter(Boolean),
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
  });

  view.dispatch({
    effects: [
      showCmdkDiffView.of({
        showCmdkDiff: true,
        originalContent: oriDoc,
        showTypewriterAnimation: true,
      }),
      resetIsCmdkDiffRejected.of(-1),
    ],
  });
}

function rejectChunks(view: EditorView) {
  const chunks = getChunks(view.state)?.chunks || [];
  // must traverse from the last to the first
  for (let i = chunks.length - 1; i >= 0; i--) {
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
  /** decoration pos  */
  inputPos = -1e9;

  private status: PromptInputStatus = 'normal';
  private inputPrompt = '';

  private chatId = '';
  private chatReq: ChatReq | null = null;
  private chatRes: ChatRes | null = null;

  constructor(
    /** pos is the selection when the widget is created */
    public oriSelPos: Pos,
    public defPrompt: string,
    public shouldFocusInput = false,
    public immediate = false,
  ) {
    super();
    // console.log(';; wid-input-ctor ', oriSelPos);
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

    // const cmdkInputStates = view.state.field(cmdkInputState);
    // unloadPromptPlugins(view, [this.inputPrompt, cmdkInputStates.prompt]);
    unloadPromptPlugins(
      view,
      [
        '',
        (document.querySelector('.prompt-input-box') as HTMLInputElement)
          ?.value || '',
      ],
      this.inputPos,
    );

    view.focus();
  }

  updateDOM(dom: HTMLElement, view: EditorView) {
    return false;
  }

  updateTipsActionsBelowInput(state: EditorState) {
    const { tips, actionBtns, promptInputBox } = queryMainElements();
    if (promptInputBox instanceof HTMLInputElement) {
      const cmdkDiffStates = state.field(cmdkDiffState, false);
      if (cmdkDiffStates.showCmdkDiff) {
        if (actionBtns.style.display !== 'flex') {
          tips.style.display = 'none';
          actionBtns.style.display = 'flex';
        }
      } else {
        if (actionBtns.style.display !== 'none') {
          tips.style.display = 'flex';
          actionBtns.style.display = 'none';
        }
      }
    }
  }

  toDOM(view: EditorView) {
    const cmdkInputStates = view.state.field(cmdkInputState, false);
    const initialPrompt = cmdkInputStates.prompt;
    // console.log(
    //   ';; wid-input-toDOM ',
    //   isCmdkDiffViewActive(view.state),
    //   cmdkDiffStates.showCmdkDiff,
    //   initialPrompt,
    //   cmdkInputStates,
    // );

    const root = document.createElement('div');
    root.className = 'cm-ai-prompt-input-root';
    root.innerHTML = `
      <form>
        <span class="cm-ai-prompt-input-icon cm-ai-prompt-input-icon-left">
          ${ICON_PROMPT}
        </span>
        <input class="prompt-input-box" placeholder="${inputWidgetOptions.promptInputPlaceholderNormal ?? PROMPT_PLACEHOLDER_NORMAL}" value="${this.defPrompt || initialPrompt}" />
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

      input.value = this.defPrompt || initialPrompt;
      input.placeholder =
        inputWidgetOptions.promptInputPlaceholderNormal ??
        PROMPT_PLACEHOLDER_NORMAL;

      if (isCmdkDiffViewActive(view.state)) {
        // /show accept/reject buttons
        tips.style.display = 'none';
        actionBtns.style.display = 'flex';
      } else {
        tips.style.display = 'flex';
        tips.innerText =
          inputWidgetOptions.promptInputTipsNormal ?? PROMPT_TIPS_NORMAL;
        actionBtns.style.display = 'none';
      }
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
      console.log(';; input-down ', e.key, e);
      if (e.key === 'z') {
        // /cmd-z for und
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          console.log(';; redo-in-input');
          // redo(view);
          // view.focus();
          // recoverSelection(view, this.oriSelPos);
          return false;
        }

        if ((e.ctrlKey || e.metaKey) && input.value === '') {
          console.log(';; undo-in-input');
          undo(view);
          view.focus();
          recoverSelection(view, this.oriSelPos);
          return false;
        }
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        acceptCmdkCode(view);
        return false;
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (e.ctrlKey || e.metaKey)
      ) {
        rejectCmdkCode(view);
        return false;
      }
    };

    rightIcon.onclick = () => {
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
      console.log(';; accept-ing ', this.inputPos);

      unloadPromptPlugins(view, ['', input.value], this.inputPos);
      moveCursorAfterAccept(view);

      view.focus();
    };
    discardBtn.onclick = () => {
      onEvent?.(view, 'discard.click', {
        chatReq: this.chatReq,
        chatRes: this.chatRes,
      });

      // beforeReject
      view.dispatch({
        effects: [setIsCmdkDiffRejected.of([0, -1])],
      });

      rejectChunks(view);
      // recoverSelection(view, this.oriSelPos);

      // afterReject
      view.dispatch({
        effects: [setIsCmdkDiffRejected.of([1, 0])],
      });

      const triggerRange = view.state.field(
        cmdkInputState,
        false,
      ).inputTriggerRange;
      console.log(';; reject-ing ', this.inputPos, triggerRange);

      // unloadPromptPlugins(view, ['', input.value]);
      view.dispatch({
        effects: [
          setPromptText.of(['', input.value]),
          hideCmdkDiffView.of({ showCmdkDiff: false }),
          setIsCmdkDiffRejected.of([-1, 1]),
          hideCmdkInput.of({ showCmdkInputCard: false }),
          setInputTriggerRange.of([
            [this.inputPos, this.inputPos],
            triggerRange,
          ]),
        ],
      });

      view.focus();
    };

    // regenBtn.onclick = async () => {
    //   onEvent?.(view, 'gen.click', {
    //     chatReq: this.chatReq,
    //     chatRes: this.chatRes,
    //   });
    //   await handleRequest();
    // };

    setTimeout(() => {
      console.log(';; focus-input ', cmdkInputStates.isPromptInputFocused);
      if (this.shouldFocusInput || cmdkInputStates.isPromptInputFocused) {
        const end = input.value.length;
        input.setSelectionRange(end, end);
        input.focus();
        queueMicrotask(() =>
          view.dispatch({
            effects: [setIsPromptInputFocused.of(false)],
          }),
        );
      }

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
/**
 * the input box for cmdk
 * @param defPrompt initial prompt
 * @param initialPos initial position for input
 * @param shouldFocusInput focus the cursor in the input when the input box show
 */
const inputPlugin = (
  defPrompt = '',
  initialPos: number[] = [],
  shouldFocusInput = false,
) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      promptInputWidget: PromptInputWidget;

      constructor(public view: EditorView) {
        let { from, to } = view.state.selection.main;
        // const triggerRange = view.state.field(
        //   cmdkInputState,
        //   false,
        // ).inputTriggerRange;
        if (
          Array.isArray(initialPos) &&
          initialPos.length > 0 &&
          initialPos[0] >= 0
        ) {
          // start position should be relative to old doc
          [from, to] = initialPos;
          from = from + 1;
        }
        const line = view.state.doc.lineAt(from);
        // show the widget before the selection head
        const pos = line.from - 1;
        if (pos < 0) {
          throw new Error('pos < 0');
        }

        console.log(
          ';; cmdk-view-ctor ',
          pos,
          line,
          view.state.doc.lineAt(view.state.selection.main.anchor).number,
          initialPos[0] >= 0
            ? view.state.doc.lineAt(initialPos[0]).number
            : initialPos,
          view.state.selection.main,
          view.state.field(cmdkInputState, false)?.inputTriggerRange,
        );

        this.promptInputWidget = new PromptInputWidget(
          { from, to },
          defPrompt,
          shouldFocusInput,
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
        // console.log(';; cmdk-viewPlugin-up ');
        this.decorations = this.decorations.map(v.changes);
        this.promptInputWidget.inputPos = this.decorations.chunkPos[0];

        if (
          checkIsCmdkDiffVisibilityChanged(v.startState, v.state) &&
          document.querySelector('.prompt-input-box') instanceof
            HTMLInputElement
        ) {
          this.promptInputWidget.updateTipsActionsBelowInput(v.state);
        }
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
      // eventHandlers: {
      //   mousedown: (e, view) => {
      //     let target = e.target as HTMLElement
      //     if (target.nodeName == "INPUT" &&
      //         target.parentElement!.classList.contains("cm-boolean-toggle"))
      //       return toggleBoolean(view, view.posAtDOM(target))
      //   }
      // }
    },
  );

const promptInputHotkeys = (hotkey?: string) => [
  Prec.high(
    keymap.of([
      {
        key: hotkey || 'Mod-k',
        run: (view) => {
          console.log(';; cmdk1-hot ', view.state.selection.main);
          activePromptInput(view);
          return true;
        },
      },
    ]),
  ),
  Prec.high(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: (view) => {
          console.log(';; cmdk1-ac ', view.state.selection.main);
          return acceptCmdkCode(view);
        },
      },
    ]),
  ),
  Prec.high(
    keymap.of([
      {
        key: 'Mod-Delete',
        run: (view) => {
          console.log(';; cmdk1-rj-del ', view.state.selection.main);
          return rejectCmdkCode(view);
        },
      },
    ]),
  ),
  Prec.high(
    keymap.of([
      {
        key: 'Mod-Backspace',
        run: (view) => {
          console.log(';; cmdk1-rj-back ', view.state.selection.main);
          return rejectCmdkCode(view);
        },
      },
    ]),
  ),
];

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

const cmdkInputRender = () => {
  return EditorState.transactionExtender.of((tr) => {
    const cmdkInputStateBefore = tr.startState.field(cmdkInputState, false);
    const cmdkInputStateAfter = tr.state.field(cmdkInputState, false);

    // console.log(
    //   ';; renderCmdkInput ',
    //   cmdkInputStateAfter.showCmdkInputCard,
    //   cmdkInputStateAfter,
    //   tr,
    // );
    if (
      checkIsCmdkInputVisibilityChanged(tr.startState, tr.state) &&
      cmdkInputStateAfter
    ) {
      if (cmdkInputStateAfter.showCmdkInputCard) {
        if (tr.isUserEvent('undo') && cmdkInputStateBefore) {
          const prevTriggerRange = cmdkInputStateBefore.inputTriggerRange;
          if (prevTriggerRange[0] >= 0) {
            return {
              effects: inputWidgetPluginCompartment.reconfigure(
                inputPlugin('', prevTriggerRange),
              ),
            };
          }
        }

        return {
          effects: inputWidgetPluginCompartment.reconfigure(inputPlugin('')),
        };
      }

      return {
        effects: [inputWidgetPluginCompartment.reconfigure([])],
      };
    }

    return null;
  });
};

const cmdkDiffViewRender = () => {
  return EditorState.transactionExtender.of((tr) => {
    const cmdkDiffStateBefore = tr.startState.field(cmdkDiffState, false);
    const cmdkDiffStateAfter = tr.state.field(cmdkDiffState, false);

    if (checkIsDocUpdatedBeforeShowDiffChanged(tr.startState, tr.state)) {
      if (
        tr.isUserEvent('redo') &&
        cmdkDiffStateAfter?.isDocUpdatedBeforeShowDiff
      ) {
        return {
          effects: [enableRedoCmdkTwice.of(true)],
        };
      }
    }

    if (checkIsCmdkDiffRejectedChanged(tr.startState, tr.state)) {
      if (
        tr.isUserEvent('redo') &&
        cmdkDiffStateAfter?.isCmdkDiffRejected === 0
      ) {
        return {
          effects: [enableRedoCmdkThrice.of(true)],
        };
      }
    }

    if (
      cmdkDiffStateAfter &&
      checkIsCmdkDiffVisibilityChanged(tr.startState, tr.state)
    ) {
      console.log(
        ';; renderCmdkDiff ',
        cmdkDiffStateAfter.showCmdkDiff,
        cmdkDiffStateAfter.isCmdkDiffRejected,
        cmdkDiffStateBefore,
        cmdkDiffStateAfter,
        tr,
      );

      const effectsWithHideDiff: Array<StateEffect<unknown>> = [
        cmdkDiffViewCompartment.reconfigure([]),
      ];
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

      if (cmdkDiffStateAfter.showCmdkDiff) {
        if (tr.isUserEvent('undo')) {
          if (cmdkDiffStateAfter.isCmdkDiffRejected === 1) {
            return {
              effects: [...effectsWithShowDiff, enableUndoCmdkThrice.of(true)],
            };
          }
        }

        return {
          effects: [...effectsWithShowDiff],
        };
      }

      if (tr.isUserEvent('undo')) {
        return {
          effects: [...effectsWithHideDiff, enableUndoCmdkTwice.of(true)],
        };
      }

      return {
        effects: effectsWithHideDiff,
      };
    }

    return null;
  });
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
    promptInputHotkeys(options.hotkey),
    cmdkUndoRedoHotkeys(),
    // inputListener,
    // inputWidgetPluginCompartment.of(inputPlugin('')),
  ];
}
