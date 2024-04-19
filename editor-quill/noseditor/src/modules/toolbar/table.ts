import Quill from 'quill';
import type DefaultModule from 'quill/src/core/module';
import type DefaultToolbar from 'quill/src/modules/toolbar';

import { getI18nText } from '../../utils/i18n';
import type { TableEditable } from '../table-editable/table';
import { ifInTableCell } from '../table-editable/utils/common';

type TableHandlerOptions = {
  dialogWidth: number;
  dialogRowNum: number;
  dialogColNum: number;
  i18n: 'zh' | 'en';
};

const defaultOptions: TableHandlerOptions = {
  dialogWidth: 200,
  dialogRowNum: 9,
  dialogColNum: 9,
  i18n: 'en',
};

const Module = Quill.import('core/module') as typeof DefaultModule;

export class TableHandler extends Module<TableHandlerOptions> {
  static genNumArr = (max: number) =>
    Array(max)
      .fill(0)
      .map((_, index) => index);

  declare options: TableHandlerOptions;

  toolbar: DefaultToolbar;
  tableDialogRoot: HTMLElement;

  constructor(quill: Quill, options: Partial<TableHandlerOptions>) {
    super(quill, options);
    this.options = { ...defaultOptions, ...options };
    this.toolbar = quill.getModule('toolbar') as DefaultToolbar;
    if (this.toolbar) {
      this.toolbar.addHandler('table', this.handleAddTableClick.bind(this));
    }
  }

  handleAddTableClick() {
    const range = this.quill.getSelection(true);
    if (!range) return;
    const currentBlot = this.quill.getLeaf(range.index)[0];
    if (ifInTableCell(currentBlot)) {
      console.warn(`Can not insert table into a table cell.`);
      return;
    }

    this.openTableDialog();
    this.quill.container.addEventListener('click', (ev) => {
      this.closeTableDialog();
    });
    window.addEventListener('resize', (et) => {
      this.closeTableDialog();
    });
  }

  openTableDialog() {
    if (this.toolbar.container.querySelector('.ql-table-dialog')) {
      this.closeTableDialog();
      return;
    }

    this.renderTableDialogContent();

    (
      Array.from(
        this.tableDialogRoot.getElementsByClassName('table-dialog-item'),
      ) as HTMLElement[]
    ).forEach((dom) => {
      dom.addEventListener('mouseover', () => {
        this.tableDialogRoot.querySelector<HTMLElement>(
          '#tableRowNumber',
        ).innerText = String(Number(dom.dataset.row) + 1);
        this.tableDialogRoot.querySelector<HTMLElement>(
          '#tableColNumber',
        ).innerText = String(Number(dom.dataset.column) + 1);
        this.updateItemBackground(dom.dataset.row, dom.dataset.column);
      });
      dom.addEventListener('click', () => {
        this.insertTable(
          Number(dom.dataset.row) + 1,
          Number(dom.dataset.column) + 1,
        );
      });
    });
  }

  renderTableDialogContent() {
    if (!this.tableDialogRoot) {
      this.tableDialogRoot = document.createElement('div');
      this.tableDialogRoot.classList.add('ql-table-dialog');
      const tableDialogLabel = getI18nText(
        'tableDialogLabel',
        this.options.i18n,
      );
      const { dialogRowNum, dialogColNum } = this.options;
      const dialogContent = `${TableHandler.genNumArr(dialogRowNum)
        .map(
          (row) =>
            `<div class="table-dialog-tr">${TableHandler.genNumArr(dialogColNum)
              .map(
                (column) =>
                  `<div class="table-dialog-item" data-row="${row}" data-column="${column}"></div>`,
              )
              .join('')}</div>`,
        )
        .join('')}
        <p><label>${tableDialogLabel}</label><span>
        <span id="tableRowNumber">0</span> X <span id="tableColNumber">0</span>
        </span></p>
      `;
      this.tableDialogRoot.innerHTML = dialogContent;
    } else {
      // clear previous bg and reset row x col
      this.updateItemBackground(-1, -1);
      this.tableDialogRoot.querySelector<HTMLElement>(
        '#tableRowNumber',
      ).innerText = '0';
      this.tableDialogRoot.querySelector<HTMLElement>(
        '#tableColNumber',
      ).innerText = '0';
    }

    const toolbarContainer = this.toolbar.container;
    const tableIcon = toolbarContainer.querySelector<HTMLElement>('.ql-table');
    const pos = this.computeDialogPosition(tableIcon);
    this.tableDialogRoot.style.setProperty('top', pos.top + 'px');
    this.tableDialogRoot.style.setProperty('left', pos.left + 'px');
    toolbarContainer.append(this.tableDialogRoot);
  }

  closeTableDialog() {
    if (this.tableDialogRoot) {
      this.tableDialogRoot.remove();
    }
    // this.tableDialogRoot = null;
  }

  computeDialogPosition(clickDom: HTMLElement) {
    const parent = clickDom.offsetParent as HTMLElement;
    const dialogWidth = this.options.dialogWidth;
    if (parent.offsetWidth > clickDom.offsetLeft + dialogWidth) {
      // /if it's wide enough
      return { top: clickDom.offsetTop + 32, left: clickDom.offsetLeft + 6 };
    } else {
      return {
        top: clickDom.offsetTop + 32,
        left: parent.offsetWidth - dialogWidth,
      };
    }
  }

  insertTable(row: number, column: number) {
    this.closeTableDialog();
    const tableEditableMod = this.quill.getModule(
      'tableEditable',
    ) as TableEditable;
    tableEditableMod.insertTable(row, column);
  }

  updateItemBackground(row: string | number, column: string | number) {
    (
      Array.from(
        this.tableDialogRoot.getElementsByClassName('table-dialog-item'),
      ) as HTMLElement[]
    ).forEach((dom) => {
      if (dom.dataset.row <= row && dom.dataset.column <= column) {
        if (!dom.classList.contains('item-hover')) {
          dom.classList.add('item-hover');
        }
        // dom.className = 'table-dialog-item item-hover';
      } else {
        if (dom.classList.contains('item-hover')) {
          dom.classList.remove('item-hover');
        }
        // dom.className = 'table-dialog-item';
      }
    });
  }
}

export default TableHandler;
