import { Text } from '@codemirror/state';

import { type Attrs, attrsEq, combineAttrs, updateAttrs } from './attributes';
import browser from './browser';
import {
  ContentView,
  DOMPos,
  mergeChildrenInto,
  noChildren,
  ViewFlag,
} from './contentview';
import type { LineDecoration, PointDecoration, WidgetType } from './decoration';
import type { DocView } from './docview';
import { clearAttributes, clientRectsFor, type Rect } from './dom';
import type { EditorView } from './editorview';
import {
  coordsInChildren,
  inlineDOMAtPos,
  joinInlineInto,
  MarkView,
  TextView,
} from './inlineview';

export interface BlockView extends ContentView {
  covers(side: -1 | 1): boolean;
  dom: HTMLElement | null;
}

export class LineView extends ContentView implements BlockView {
  children: ContentView[] = [];
  length: number = 0;
  declare dom: HTMLElement | null;
  prevAttrs: Attrs | null | undefined = undefined;
  attrs: Attrs | null = null;
  breakAfter = 0;
  declare parent: DocView | null;

  // Consumes source
  merge(
    from: number,
    to: number,
    source: BlockView | null,
    hasStart: boolean,
    openStart: number,
    openEnd: number,
  ): boolean {
    if (source) {
      if (!(source instanceof LineView)) return false;
      if (!this.dom) source.transferDOM(this); // Reuse source.dom when appropriate
    }
    if (hasStart) this.setDeco(source ? source.attrs : null);
    mergeChildrenInto(
      this,
      from,
      to,
      source ? source.children.slice() : [],
      openStart,
      openEnd,
    );
    return true;
  }

  split(at: number) {
    const end = new LineView();
    end.breakAfter = this.breakAfter;
    if (this.length == 0) return end;
    let { i, off } = this.childPos(at);
    if (off) {
      end.append(this.children[i].split(off), 0);
      this.children[i].merge(off, this.children[i].length, null, false, 0, 0);
      i++;
    }
    for (let j = i; j < this.children.length; j++)
      end.append(this.children[j], 0);
    while (i > 0 && this.children[i - 1].length == 0)
      this.children[--i].destroy();
    this.children.length = i;
    this.markDirty();
    this.length = at;
    return end;
  }

  transferDOM(other: LineView) {
    if (!this.dom) return;
    this.markDirty();
    other.setDOM(this.dom);
    other.prevAttrs =
      this.prevAttrs === undefined ? this.attrs : this.prevAttrs;
    this.prevAttrs = undefined;
    this.dom = null;
  }

  setDeco(attrs: Attrs | null) {
    if (!attrsEq(this.attrs, attrs)) {
      if (this.dom) {
        this.prevAttrs = this.attrs;
        this.markDirty();
      }
      this.attrs = attrs;
    }
  }

  append(child: ContentView, openStart: number) {
    joinInlineInto(this, child, openStart);
  }

  // Only called when building a line view in ContentBuilder
  addLineDeco(deco: LineDecoration) {
    const attrs = deco.spec.attributes;
    const cls = deco.spec.class;
    if (attrs) this.attrs = combineAttrs(attrs, this.attrs || {});
    if (cls) this.attrs = combineAttrs({ class: cls }, this.attrs || {});
  }

  domAtPos(pos: number): DOMPos {
    return inlineDOMAtPos(this, pos);
  }

  reuseDOM(node: Node) {
    if (node.nodeName == 'DIV') {
      this.setDOM(node);
      this.flags |= ViewFlag.AttrsDirty | ViewFlag.NodeDirty;
    }
  }

  sync(view: EditorView, track?: { node: Node; written: boolean }) {
    if (!this.dom) {
      this.setDOM(document.createElement('div'));
      this.dom!.className = 'cm-line';
      this.prevAttrs = this.attrs ? null : undefined;
    } else if (this.flags & ViewFlag.AttrsDirty) {
      clearAttributes(this.dom);
      this.dom!.className = 'cm-line';
      this.prevAttrs = this.attrs ? null : undefined;
    }
    if (this.prevAttrs !== undefined) {
      updateAttrs(this.dom!, this.prevAttrs, this.attrs);
      this.dom!.classList.add('cm-line');
      this.prevAttrs = undefined;
    }
    super.sync(view, track);
    let last = this.dom!.lastChild;
    while (last && ContentView.get(last) instanceof MarkView)
      last = last.lastChild;
    if (
      !last ||
      !this.length ||
      (last.nodeName != 'BR' &&
        ContentView.get(last)?.isEditable == false &&
        (!browser.ios || !this.children.some((ch) => ch instanceof TextView)))
    ) {
      const hack = document.createElement('BR');
      (hack as any).cmIgnore = true;
      this.dom!.appendChild(hack);
    }
  }

  measureTextSize(): {
    lineHeight: number;
    charWidth: number;
    textHeight: number;
  } | null {
    if (this.children.length == 0 || this.length > 20) return null;
    let totalWidth = 0;
    let textHeight!: number;
    for (const child of this.children) {
      if (!(child instanceof TextView) || /[^ -~]/.test(child.text))
        return null;
      const rects = clientRectsFor(child.dom!);
      if (rects.length != 1) return null;
      totalWidth += rects[0].width;
      textHeight = rects[0].height;
    }
    return !totalWidth
      ? null
      : {
          lineHeight: this.dom!.getBoundingClientRect().height,
          charWidth: totalWidth / this.length,
          textHeight,
        };
  }

  coordsAt(pos: number, side: number): Rect | null {
    const rect = coordsInChildren(this, pos, side);
    // Correct rectangle height for empty lines when the returned
    // height is larger than the text height.
    if (!this.children.length && rect && this.parent) {
      const { heightOracle } = this.parent.view.viewState;
      const height = rect.bottom - rect.top;
      if (
        Math.abs(height - heightOracle.lineHeight) < 2 &&
        heightOracle.textHeight < height
      ) {
        const dist = (height - heightOracle.textHeight) / 2;
        return {
          top: rect.top + dist,
          bottom: rect.bottom - dist,
          left: rect.left,
          right: rect.left,
        };
      }
    }
    return rect;
  }

  become(other: ContentView) {
    return (
      other instanceof LineView &&
      this.children.length == 0 &&
      other.children.length == 0 &&
      attrsEq(this.attrs, other.attrs) &&
      this.breakAfter == other.breakAfter
    );
  }

  covers() {
    return true;
  }

  static find(docView: DocView, pos: number): LineView | null {
    for (let i = 0, off = 0; i < docView.children.length; i++) {
      const block = docView.children[i];
      const end = off + block.length;
      if (end >= pos) {
        if (block instanceof LineView) return block;
        if (end > pos) break;
      }
      off = end + block.breakAfter;
    }
    return null;
  }
}

export class BlockWidgetView extends ContentView implements BlockView {
  declare dom: HTMLElement | null;
  declare parent: DocView | null;
  breakAfter = 0;
  prevWidget: WidgetType | null = null;

  constructor(
    public widget: WidgetType,
    public length: number,
    public deco: PointDecoration,
  ) {
    super();
  }

  merge(
    from: number,
    to: number,
    source: ContentView | null,
    _takeDeco: boolean,
    openStart: number,
    openEnd: number,
  ): boolean {
    if (
      source &&
      (!(source instanceof BlockWidgetView) ||
        !this.widget.compare(source.widget) ||
        (from > 0 && openStart <= 0) ||
        (to < this.length && openEnd <= 0))
    )
      return false;
    this.length = from + (source ? source.length : 0) + (this.length - to);
    return true;
  }

  domAtPos(pos: number) {
    return pos == 0
      ? DOMPos.before(this.dom!)
      : DOMPos.after(this.dom!, pos == this.length);
  }

  split(at: number) {
    const len = this.length - at;
    this.length = at;
    const end = new BlockWidgetView(this.widget, len, this.deco);
    end.breakAfter = this.breakAfter;
    return end;
  }

  get children() {
    return noChildren;
  }

  sync(view: EditorView) {
    if (!this.dom || !this.widget.updateDOM(this.dom, view)) {
      if (this.dom && this.prevWidget) this.prevWidget.destroy(this.dom);
      this.prevWidget = null;
      this.setDOM(this.widget.toDOM(view));
      if (!this.widget.editable) this.dom!.contentEditable = 'false';
    }
  }

  get overrideDOMText() {
    return this.parent
      ? this.parent!.view.state.doc.slice(this.posAtStart, this.posAtEnd)
      : Text.empty;
  }

  domBoundsAround() {
    return null;
  }

  become(other: ContentView) {
    if (
      other instanceof BlockWidgetView &&
      other.widget.constructor == this.widget.constructor
    ) {
      if (!other.widget.compare(this.widget)) this.markDirty(true);
      if (this.dom && !this.prevWidget) this.prevWidget = this.widget;
      this.widget = other.widget;
      this.length = other.length;
      this.deco = other.deco;
      this.breakAfter = other.breakAfter;
      return true;
    }
    return false;
  }

  ignoreMutation(): boolean {
    return true;
  }
  ignoreEvent(event: Event): boolean {
    return this.widget.ignoreEvent(event);
  }

  get isEditable() {
    return false;
  }

  get isWidget() {
    return true;
  }

  coordsAt(pos: number, side: number) {
    return this.widget.coordsAt(this.dom!, pos, side);
  }

  destroy() {
    super.destroy();
    if (this.dom) this.widget.destroy(this.dom);
  }

  covers(side: -1 | 1) {
    const { startSide, endSide } = this.deco;
    return startSide == endSide
      ? false
      : side < 0
        ? startSide < 0
        : endSide > 0;
  }
}
