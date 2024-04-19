import type * as ParchmentTypes from 'parchment';
import Quill from 'quill';

import IconAlignCenter from '../assets/icons/align-center.svg';
import IconAlignLeft from '../assets/icons/align-left.svg';
import IconAlignRight from '../assets/icons/align-right.svg';
import Delete from '../assets/icons/delete.svg';
import Words from '../assets/icons/words.svg';
import { genIconDom } from '../config/icons-config';
import { isMobile, throttle } from '../utils/common';
import { getI18nText } from '../utils/i18n';

const defaultOptions = {
  modules: ['DisplaySize', 'Toolbar', 'Resize'],
  overlayStyles: {
    position: 'absolute',
    zIndex: 10,
    border: '1px dashed #dbc8ff',
  },
  handleStyles: {
    position: 'absolute',
    height: '12px',
    width: '12px',
    backgroundColor: 'white',
    border: '1px solid #777',
    opacity: '0.60',
  },
  displayStyles: {
    position: 'absolute',
    padding: '4px 8px',
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #e7e7e7',
    opacity: '0.70',
    cursor: 'default',
  },
  toolbarStyles: {
    position: 'absolute',
    top: '-12px',
    left: 'calc(50% - 36px)',
    textAlign: 'center',
    color: '#333',
    width: '72px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  toolbarButtonStyles: {
    display: 'flex',
    width: '24px',
    height: '24px',
    background: 'white',
    border: '1px solid #e7e7e7',
    cursor: 'pointer',
    zIndex: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonSvgStyles: {
    // fill: '#6918b4',
    // stroke: '#6918b4',
    // strokeWidth: '1',
  },
};

class BaseModule {
  overlay: any;
  img: any;
  options: any;
  requestUpdate: any;

  constructor(resizer) {
    this.overlay = resizer.overlay;
    this.img = resizer.img;
    this.options = resizer.options;
    this.requestUpdate = resizer.onUpdate;
  }
  /*
        requestUpdate (passed in by the library during construction, above) can be used to let the library know that
        you've changed something about the image that would require re-calculating the overlay (and all of its child
        elements)
        For example, if you add a margin to the element, you'll want to call this or else all the controls will be
        misaligned on-screen.
     */

  /*
        onCreate will be called when the element is clicked on
        If the module has any user controls, it should create any containers that it'll need here.
        The overlay has absolute positioning, and will be automatically repositioned and resized as needed, so you can
        use your own absolute positioning and the 'top', 'right', etc. styles to be positioned relative to the element
        on-screen.
     */
  onCreate() {}

  /*
        onDestroy will be called when the element is de-selected, or when this module otherwise needs to tidy up.
        If you created any DOM elements in onCreate, please remove them from the DOM and destroy them here.
     */
  onDestroy() {}

  /*
        onUpdate will be called any time that the element is changed (e.g. resized, aligned, etc.)
        This frequently happens during resize dragging, so keep computations light while here to ensure a smooth
        user experience.
     */
  onUpdate() {}
}

class DisplaySize extends BaseModule {
  onCreate = () => {
    // Create the container to hold the size display
    this.display = document.createElement('div');

    // Apply styles
    Object.assign(this.display.style, this.options.displayStyles);

    // Attach it
    this.overlay.appendChild(this.display);
  };
  display: HTMLDivElement;

  onDestroy() {}

  onUpdate = () => {
    if (!this.display || !this.img) {
      return;
    }

    const size = this.getCurrentSize();
    this.display.innerHTML = size.join(' &times; ');
    if (size[0] > 120 && size[1] > 30) {
      // position on top of image
      Object.assign(this.display.style, {
        right: '4px',
        bottom: '4px',
        left: 'auto',
      });
    } else if (this.img.style.float === 'right') {
      // position off bottom left
      const dispRect = this.display.getBoundingClientRect();
      Object.assign(this.display.style, {
        right: 'auto',
        bottom: `-${dispRect.height + 4}px`,
        left: `-${dispRect.width + 4}px`,
      });
    } else {
      // position off bottom right
      const dispRect = this.display.getBoundingClientRect();
      Object.assign(this.display.style, {
        right: `-${dispRect.width + 4}px`,
        bottom: `-${dispRect.height + 4}px`,
        left: 'auto',
      });
    }
  };

  getCurrentSize = () => [
    this.img.width,
    Math.round(
      (this.img.width / this.img.naturalWidth) * this.img.naturalHeight,
    ),
  ];
}

class Resize extends BaseModule {
  isMobile = isMobile();

  onCreate = () => {
    // track resize handles
    this.boxes = [];

    // add 4 resize handles
    this.addBox('nwse-resize'); // top left
    this.addBox('nesw-resize'); // top right
    this.addBox('nwse-resize'); // bottom right
    this.addBox('nesw-resize'); // bottom left

    this.positionBoxes();
  };

  onDestroy = () => {
    // reset drag handle cursors
    this.setCursor('');
  };

  positionBoxes = () => {
    const handleXOffset = `${-parseFloat(this.options.handleStyles.width) / 2}px`;
    const handleYOffset = `${-parseFloat(this.options.handleStyles.height) / 2}px`;

    // set the top and left for each drag handle
    [
      { left: handleXOffset, top: handleYOffset }, // top left
      { right: handleXOffset, top: handleYOffset }, // top right
      { right: handleXOffset, bottom: handleYOffset }, // bottom right
      { left: handleXOffset, bottom: handleYOffset }, // bottom left
    ].forEach((pos, idx) => {
      Object.assign(this.boxes[idx].style, pos);
    });
  };

  addBox = (cursor) => {
    // create div element for resize handle
    const box = document.createElement('div');

    // Star with the specified styles
    Object.assign(box.style, this.options.handleStyles);
    box.style.cursor = cursor;

    // Set the width/height to use 'px'
    box.style.width = `${this.options.handleStyles.width}px`;
    box.style.height = `${this.options.handleStyles.height}px`;

    // listen for mousedown on each box
    if (this.isMobile) {
      box.addEventListener('touchstart', this.handleMousedown, false);
    } else {
      box.addEventListener('mousedown', this.handleMousedown, false);
    }
    // add drag handle to document
    this.overlay.appendChild(box);
    // keep track of drag handle
    this.boxes.push(box);
  };

  handleMousedown = (evt) => {
    // note which box
    this.dragBox = evt.target;
    // note starting mousedown position
    if (this.isMobile) {
      this.dragStartX = evt.touches[0].clientX;
    } else {
      this.dragStartX = evt.clientX;
    }
    // store the width before the drag
    this.preDragWidth = this.img.width || this.img.naturalWidth;
    // set the proper cursor everywhere
    this.setCursor(this.dragBox.style.cursor);
    // listen for movement and mouseup
    if (this.isMobile) {
      document.addEventListener('touchmove', this.handleDrag, false);
      document.addEventListener('touchend', this.handleMouseup, false);
    } else {
      document.addEventListener('mousemove', this.handleDrag, false);
      document.addEventListener('mouseup', this.handleMouseup, false);
    }
  };

  handleMouseup = () => {
    // reset cursor everywhere
    this.setCursor('');
    // stop listening for movement and mouseup
    if (this.isMobile) {
      document.removeEventListener('touchmove', this.handleDrag);
      document.removeEventListener('touchend', this.handleMouseup);
    } else {
      document.removeEventListener('mousemove', this.handleDrag);
      document.removeEventListener('mouseup', this.handleMouseup);
    }
  };

  handleDrag = (evt) => {
    if (!this.img) {
      // image not set yet
      return;
    }
    // update image size
    let clientX;
    if (this.isMobile) {
      clientX = evt.touches[0].clientX;
    } else {
      clientX = evt.clientX;
    }
    const deltaX = clientX - this.dragStartX;
    if (this.dragBox === this.boxes[0] || this.dragBox === this.boxes[3]) {
      // left-side resize handler; dragging right shrinks image
      this.img.width = Math.round(this.preDragWidth - deltaX);
    } else {
      // right-side resize handler; dragging right enlarges image
      this.img.width = Math.round(this.preDragWidth + deltaX);
    }
    this.requestUpdate();
  };

  setCursor = (value) => {
    [document.body, this.img].forEach((el) => {
      el.style.cursor = value; // eslint-disable-line no-param-reassign
    });
  };
  boxes: any[];
  dragBox: any;
  dragStartX: any;
  preDragWidth: any;
}

const Parchment = Quill.imports.parchment as typeof ParchmentTypes;
const FloatStyle = new Parchment.StyleAttributor('float', 'float');
const MarginStyle = new Parchment.StyleAttributor('margin', 'margin');
const DisplayStyle = new Parchment.StyleAttributor('display', 'display');

class Toolbar extends BaseModule {
  quill: any;
  hide: any;
  toolbar: HTMLDivElement;
  alignments: { icon: string; apply: () => void; isApplied: () => boolean }[];
  constructor(props) {
    super(props);
    this.quill = props.quill;
    this.hide = props.hide;
    this.options = props.options;
  }
  onCreate = () => {
    // Setup Toolbar
    this.toolbar = document.createElement('div');
    Object.assign(this.toolbar.style, this.options.toolbarStyles);
    this.overlay.appendChild(this.toolbar);

    // Setup Buttons
    this._defineAlignments();
    this._addToolbarButtons();
  };

  // The toolbar and its children will be destroyed when the overlay is removed
  onDestroy() {}

  // Nothing to update on drag because we are are positioned relative to the overlay
  onUpdate() {}

  _defineAlignments = () => {
    const index = this.quill.getIndex(Quill.find(this.img)); // the index of image
    this.alignments = [
      {
        icon: IconAlignLeft,
        apply: () => {
          DisplayStyle.add(this.img, 'inline');
          FloatStyle.add(this.img, 'left');
          MarginStyle.add(this.img, '0 1em 1em 0');
          this.quill.formatLine(index + 2, 1, 'align', false); // 左对齐在 Quill 其实是不设置 align，设置 align=left 反而有问题
          // this.img.parentNode.classList.add('')
        },
        isApplied: () => FloatStyle.value(this.img) === 'left',
      },
      {
        icon: IconAlignCenter,
        apply: () => {
          DisplayStyle.add(this.img, 'block');
          FloatStyle.remove(this.img);
          MarginStyle.add(this.img, 'auto');
          this.quill.formatLine(index + 2, 1, 'align', 'center');
          this.img.parentNode.classList.add('img-center');
        },
        isApplied: () => MarginStyle.value(this.img) === 'auto',
      },
      {
        icon: IconAlignRight,
        apply: () => {
          DisplayStyle.add(this.img, 'inline');
          FloatStyle.add(this.img, 'right');
          MarginStyle.add(this.img, '0 0 1em 1em');
          this.quill.formatLine(index + 2, 1, 'align', 'right');
          this.img.parentNode.classList.add('float-right');
        },
        isApplied: () => FloatStyle.value(this.img) === 'right',
      },
      {
        icon: Words,
        apply: () => {
          let align;
          if (MarginStyle.value(this.img) === 'auto') {
            align = 'center';
          } else if (FloatStyle.value(this.img)) {
            align = FloatStyle.value(this.img);
          }
          const imgRemarkPre =
            this.options.imgRemarkPre ||
            getI18nText('imgRemarkPre', this.options.i18n);
          this.quill.insertText(index + 1, `\n${imgRemarkPre}`, {
            color: '#999999',
            size: '12px',
          });
          this.quill.insertText(index + 2 + imgRemarkPre.length, '\n', {
            align,
          });
          this.quill.setSelection(
            index + 2 + imgRemarkPre.length,
            Quill.sources.SILENT,
          );
          this.img.setAttribute('data-remark', '1');
        },
        isApplied: () => this.img.getAttribute('data-remark') === '1',
      },
      {
        icon: Delete,
        apply: () => {
          // @ts-expect-error fix-types
          Quill.find(this.img).deleteAt(0);
          this.hide();
        },
        isApplied: () => false,
      },
    ];
  };

  _addToolbarButtons = () => {
    const buttons = [];
    const words = getI18nText(
      ['alignLeft', 'alignCenter', 'alignRight', 'imgRemarkLabel', 'deleteImg'],
      this.options.i18n,
    );
    this.alignments.forEach((alignment, idx) => {
      const button = document.createElement('span');
      buttons.push(button);
      button.innerHTML = genIconDom(alignment.icon, words[idx]);
      button.addEventListener('click', () => {
        // deselect all buttons
        buttons.forEach((bt, index) => {
          if (index !== 3) bt.style.filter = ''; // 第 4 位是备注，可以和其他共存
        });
        if (alignment.isApplied()) {
          // If applied, unapply
          FloatStyle.remove(this.img);
          MarginStyle.remove(this.img);
          DisplayStyle.remove(this.img);
        } else {
          // otherwise, select button and apply
          this._selectButton(button);
          alignment.apply();
        }
        // image may change position; redraw drag handles
        this.requestUpdate();
      });
      Object.assign(button.style, this.options.toolbarButtonStyles);
      if (idx > 0) {
        button.style.borderLeftWidth = '0';
      }
      // 注释掉这行代码，有报错，参考：https://github.com/kensnyder/quill-image-resize-module/issues/39
      // Object.assign(
      //   button.children[0].style,
      //   this.options.toolbarButtonSvgStyles,
      // );
      if (alignment.isApplied()) {
        // select button if previously applied
        this._selectButton(button);
      }
      this.toolbar.appendChild(button);
    });
  };

  _selectButton(button) {
    button.style.filter = 'invert(20%)';
  }
}

const knownModules = { DisplaySize, Toolbar, Resize };

/**
调整图片大小
主要参考quill-image-resize-module，但是原包依赖quill版本较低，会导致包体积大（还有lodash）；
另外必须window上有Quill，在建构工具中添加变量会导致和syntax的highlight冲突
*/
export class ImageResize {
  quill: any;
  options: {
    modules: string[];
    overlayStyles: { position: string; zIndex: number; border: string };
    handleStyles: {
      position: string;
      height: string;
      width: string;
      backgroundColor: string;
      border: string;
      opacity: string;
    };
    displayStyles: {
      position: string;
      padding: string;
      textAlign: string;
      backgroundColor: string;
      color: string;
      border: string;
      opacity: string;
      cursor: string;
    };
    toolbarStyles: {
      position: string;
      top: string;
      left: string;
      textAlign: string;
      color: string;
      width: string;
      display: string;
      flexWrap: string;
      justifyContent: string;
    };
    toolbarButtonStyles: {
      display: string;
      width: string;
      height: string;
      background: string;
      border: string;
      cursor: string;
      zIndex: number;
      justifyContent: string;
      alignItems: string;
    };
    toolbarButtonSvgStyles: {};
  };
  moduleClasses: any;
  modules: any[];
  img: any;
  overlay: any;
  constructor(quill, options: any = {}) {
    // save the quill reference and options
    this.quill = quill;

    // Apply the options to our defaults, and stash them for later
    // defaultsDeep doesn't do arrays as you'd expect, so we'll need to apply the classes array from options separately
    let moduleClasses = false;
    if (options.modules) {
      moduleClasses = options.modules.slice();
    }

    // Apply options to default options
    // this.options = defaultsDeep({}, options, DefaultOptions);
    this.options = { ...defaultOptions, ...options };

    // (see above about moduleClasses)
    if (moduleClasses !== false) {
      // @ts-expect-error fix-types
      this.options.modules = moduleClasses;
    }

    // disable native image resizing on firefox
    document.execCommand('enableObjectResizing', false, 'false');

    // respond to clicks inside the editor
    this.quill.root.addEventListener('click', this.handleClick, false);

    this.quill.root.parentNode.style.position =
      this.quill.root.parentNode.style.position || 'relative';

    // setup modules
    this.moduleClasses = this.options.modules;

    this.modules = [];
  }

  initializeModules = () => {
    this.removeModules();

    this.modules = this.moduleClasses.map(
      (ModuleClass) => new (knownModules[ModuleClass] || ModuleClass)(this),
    );

    this.modules.forEach((module) => {
      module.onCreate();
    });

    this.onUpdate();
  };

  onUpdate = () => {
    this.repositionElements();
    this.modules.forEach((module) => {
      module.onUpdate();
    });
  };

  removeModules = () => {
    this.modules.forEach((module) => {
      module.onDestroy();
    });

    this.modules = [];
  };

  handleClick = (evt) => {
    if (
      evt.target &&
      evt.target.tagName &&
      evt.target.tagName.toUpperCase() === 'IMG'
    ) {
      if (this.img === evt.target) {
        // we are already focused on this image
        return;
      }
      if (this.img) {
        // we were just focused on another image
        this.hide();
      }
      // clicked on an image inside the editor
      this.show(evt.target);
    } else if (this.img) {
      // clicked on a non image
      this.hide();
    }
  };

  show = (img) => {
    // keep track of this img element
    this.img = img;

    this.showOverlay();

    this.initializeModules();
  };

  showOverlay = () => {
    if (this.overlay) {
      this.hideOverlay();
    }

    // this.quill.setSelection(null);

    // prevent spurious text selection
    this.setUserSelect('none');

    // listen for the image being deleted or moved
    document.addEventListener('keyup', this.checkImage, true);
    this.quill.root.addEventListener('input', this.checkImage, true);

    // Create and add the overlay
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, this.options.overlayStyles);

    this.quill.root.parentNode.appendChild(this.overlay);
    // 编辑器滚动隐藏 overlay
    this.quill.root.addEventListener(
      'scroll',
      throttle(() => {
        if (this.img && this.overlay) {
          this.hide();
        }
      }),
    );

    this.repositionElements();
  };

  hideOverlay = () => {
    if (!this.overlay) {
      return;
    }

    // Remove the overlay
    this.quill.root.parentNode.removeChild(this.overlay);
    this.overlay = undefined;

    // stop listening for image deletion or movement
    document.removeEventListener('keyup', this.checkImage);
    this.quill.root.removeEventListener('input', this.checkImage);

    // reset user-select
    this.setUserSelect('');
  };

  repositionElements = () => {
    if (!this.overlay || !this.img) {
      return;
    }

    // position the overlay over the image
    const parent = this.quill.root.parentNode;
    const imgRect = this.img.getBoundingClientRect();
    const containerRect = parent.getBoundingClientRect();

    Object.assign(this.overlay.style, {
      left: `${imgRect.left - containerRect.left - 1 + parent.scrollLeft}px`,
      top: `${imgRect.top - containerRect.top + parent.scrollTop}px`,
      width: `${imgRect.width}px`,
      height: `${imgRect.height}px`,
    });
  };

  hide = () => {
    this.hideOverlay();
    this.removeModules();
    this.img = undefined;
  };

  setUserSelect = (value) => {
    ['userSelect', 'mozUserSelect', 'webkitUserSelect', 'msUserSelect'].forEach(
      (prop) => {
        // set on contenteditable element and <html>
        this.quill.root.style[prop] = value;
        document.documentElement.style[prop] = value;
      },
    );
  };

  checkImage = (evt) => {
    if (this.img) {
      if (evt.keyCode === 46 || evt.keyCode === 8) {
        // @ts-expect-error fix-types
        Quill.find(this.img).deleteAt(0); // find为静态方法，原来这里有 bug 未生效
      }
      this.hide();
    }
  };
}

export default ImageResize;
