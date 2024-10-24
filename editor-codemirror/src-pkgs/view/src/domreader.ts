import { ContentView } from './contentview';
import { domIndex, maxOffset, isBlockElement } from './dom';
import { EditorState } from '@codemirror/state';

export const LineBreakPlaceholder = '\uffff';

export class DOMReader {
  text: string = '';
  lineSeparator: string | undefined;

  constructor(
    private points: DOMPoint[],
    state: EditorState,
  ) {
    this.lineSeparator = state.facet(EditorState.lineSeparator);
  }

  append(text: string) {
    this.text += text;
  }

  lineBreak() {
    this.text += LineBreakPlaceholder;
  }

  readRange(start: Node | null, end: Node | null) {
    if (!start) return this;
    const parent = start.parentNode!;
    for (let cur = start; ; ) {
      this.findPointBefore(parent, cur);
      const oldLen = this.text.length;
      this.readNode(cur);
      const next: Node | null = cur.nextSibling;
      if (next == end) break;
      const view = ContentView.get(cur);
      const nextView = ContentView.get(next!);
      if (
        view && nextView
          ? view.breakAfter
          : (view ? view.breakAfter : isBlockElement(cur)) ||
            (isBlockElement(next!) &&
              (cur.nodeName != 'BR' || (cur as any).cmIgnore) &&
              this.text.length > oldLen)
      )
        this.lineBreak();
      cur = next!;
    }
    this.findPointBefore(parent, end);
    return this;
  }

  readTextNode(node: Text) {
    const text = node.nodeValue!;
    for (const point of this.points)
      if (point.node == node)
        point.pos = this.text.length + Math.min(point.offset, text.length);

    for (let off = 0, re = this.lineSeparator ? null : /\r\n?|\n/g; ; ) {
      let nextBreak = -1;
      let breakSize = 1;
      let m;
      if (this.lineSeparator) {
        nextBreak = text.indexOf(this.lineSeparator, off);
        breakSize = this.lineSeparator.length;
      } else if ((m = re!.exec(text))) {
        nextBreak = m.index;
        breakSize = m[0].length;
      }
      this.append(text.slice(off, nextBreak < 0 ? text.length : nextBreak));
      if (nextBreak < 0) break;
      this.lineBreak();
      if (breakSize > 1)
        for (const point of this.points)
          if (point.node == node && point.pos > this.text.length)
            point.pos -= breakSize - 1;
      off = nextBreak + breakSize;
    }
  }

  readNode(node: Node) {
    if ((node as any).cmIgnore) return;
    const view = ContentView.get(node);
    const fromView = view && view.overrideDOMText;
    if (fromView != null) {
      this.findPointInside(node, fromView.length);
      for (let i = fromView.iter(); !i.next().done; ) {
        if (i.lineBreak) this.lineBreak();
        else this.append(i.value);
      }
    } else if (node.nodeType == 3) {
      this.readTextNode(node as Text);
    } else if (node.nodeName == 'BR') {
      if (node.nextSibling) this.lineBreak();
    } else if (node.nodeType == 1) {
      this.readRange(node.firstChild, null);
    }
  }

  findPointBefore(node: Node, next: Node | null) {
    for (const point of this.points)
      if (point.node == node && node.childNodes[point.offset] == next)
        point.pos = this.text.length;
  }

  findPointInside(node: Node, length: number) {
    for (const point of this.points)
      if (node.nodeType == 3 ? point.node == node : node.contains(point.node))
        point.pos =
          this.text.length +
          (isAtEnd(node, point.node, point.offset) ? length : 0);
  }
}

function isAtEnd(parent: Node, node: Node | null, offset: number) {
  for (;;) {
    if (!node || offset < maxOffset(node)) return false;
    if (node == parent) return true;
    offset = domIndex(node) + 1;
    node = node.parentNode;
  }
}

export class DOMPoint {
  pos: number = -1;
  constructor(
    readonly node: Node,
    readonly offset: number,
  ) {}
}
