import Quill from 'quill';
import type DefaultListItem from 'quill/src/formats/list';

const QuillListItem = Quill.import('formats/list') as typeof DefaultListItem;
// const ListContainer = Quill.import('formats/list');
// const ATTRIBUTES = ['data-list', 'data-start'];

export class ListItem extends QuillListItem {
  // 通过Delta数据重构Dom
  static create(value) {
    // @ts-expect-error fix-types
    const node = super.create();
    if (value.indexOf('-') > 0) {
      const arr = value.split('-');
      node.setAttribute('data-list', arr[0]);
      node.style.setProperty('--list-item-start', arr[1]);
      node.setAttribute('data-start', arr[1]);
    } else {
      node.setAttribute('data-list', value);
    }
    return node;
  }

  // 保存在Delta中
  static formats(domNode) {
    if (
      domNode.hasAttribute('data-start') &&
      domNode.getAttribute('data-start') !== '1'
    ) {
      return `${domNode.getAttribute('data-list')}-${domNode.getAttribute('data-start')}`;
    }
    return domNode.getAttribute('data-list') || undefined;
  }

  // 在CSS中使用变量，拼接样式，使用全局变量var，先定义变量：--list-item-start
  format(name, value) {
    if (name === this.statics.blotName && value) {
      if (value.indexOf('-') > 0) {
        const arr = value.split('-');
        this.domNode.setAttribute('data-list', arr[0]);
        this.domNode.style.setProperty('--list-item-start', arr[1]);
        this.domNode.setAttribute('data-start', arr[1]);
      } else {
        this.domNode.setAttribute('data-list', value);
      }
    } else {
      super.format(name, value);
    }
  }
}

export default ListItem;
