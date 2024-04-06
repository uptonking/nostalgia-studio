import Delta, { AttributeMap, Op, OpIterator } from 'quill-delta';

import Block, { BlockEmbed } from './blots/block';
import Break from './blots/break';
import Container from './blots/container';
import Cursor from './blots/cursor';
import Embed from './blots/embed';
import Inline from './blots/inline';
import Scroll from './blots/scroll';
import TextBlot from './blots/text';
import type {
  Bounds,
  DebugLevel,
  EmitterSource,
  ExpandedQuillOptions,
  QuillOptions,
} from './core/quill';
import Quill, { Parchment, Range } from './core/quill';
import Clipboard from './modules/clipboard';
import History from './modules/history';
import Input from './modules/input';
import Keyboard from './modules/keyboard';
import UINode from './modules/uiNode';
import Uploader from './modules/uploader';

export { Delta, Op, OpIterator, AttributeMap, Parchment, Range };
export type {
  Bounds,
  DebugLevel,
  EmitterSource,
  ExpandedQuillOptions,
  QuillOptions,
};

Quill.register({
  'blots/block': Block,
  'blots/block/embed': BlockEmbed,
  'blots/break': Break,
  'blots/container': Container,
  'blots/cursor': Cursor,
  'blots/embed': Embed,
  'blots/inline': Inline,
  'blots/scroll': Scroll,
  'blots/text': TextBlot,

  'modules/clipboard': Clipboard,
  'modules/history': History,
  'modules/keyboard': Keyboard,
  'modules/uploader': Uploader,
  'modules/input': Input,
  'modules/uiNode': UINode,
});

export default Quill;
