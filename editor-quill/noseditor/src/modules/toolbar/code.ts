import Quill from 'quill';
import type DefaultToolbar from 'quill/src/modules/toolbar';

const Module = Quill.import('core/module');

class CodeHandler extends Module {
  toolbar: unknown;

  constructor(quill: Quill, options) {
    super(quill, options);

    this.quill = quill;
    this.options = options || {};
    this.toolbar = quill.getModule('toolbar') as DefaultToolbar;
    if (typeof this.toolbar !== 'undefined') {
      // @ts-expect-error fix-types
      this.toolbar.addHandler('code-block', this.handleCodeClick.bind(this));
    }
  }

  handleCodeClick() {
    const selection = this.quill.getSelection();
    if (!selection) return;
    // this.quill.updateContents(new Delta().retain(selection.index).insert('\n').insert('aw', {'code-block': true}).insert('\n'));

    // 当代码块下无内容，自动加一个空行
    if (this.quill.getText(selection.index) === '\n') {
      this.quill.insertText(selection.index, '\n');
      this.quill.formatLine(selection.index, 1, 'code-block', true);
      this.quill.setSelection(selection.index);
    } else {
      this.quill.formatLine(selection.index, 1, 'code-block', true);
    }
  }
}

export default CodeHandler;
