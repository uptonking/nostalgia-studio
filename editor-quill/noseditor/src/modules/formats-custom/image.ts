import Quill from 'quill';
import type DefaultImage from 'quill/src/formats/image';

const Parchment = Quill.import('parchment');
const BaseImage = Quill.import('formats/image') as typeof DefaultImage;

const ATTRIBUTES = ['alt', 'height', 'width', 'style'];

const WHITE_STYLE = ['margin', 'display', 'float'];

// 1.4.0: 图片的位置状态保存及复现（Delta中保存位置）
// 参考：https://github.com/kensnyder/quill-image-resize-module/issues/10
export class Image extends BaseImage {
  static formats(domNode) {
    return ATTRIBUTES.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        if (name === 'style') {
          value = this.sanitize_style(value);
        }
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  sanitize_style(style) {
    const style_arr = style.split(';');
    let allow_style = '';
    style_arr.forEach((v, i) => {
      if (WHITE_STYLE.indexOf(v.trim().split(':')[0]) !== -1) {
        allow_style += v + ';';
      }
    });
    return allow_style;
  }
}

export default Image;
