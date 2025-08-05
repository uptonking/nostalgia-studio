import '../styles/editor-examples.css';
// import { applyDevTools } from 'prosemirror-dev-toolkit';

import React, {
  type ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { exampleSetup } from 'prosemirror-example-setup';
import { DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { EditorState, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

import styled from '@emotion/styled';

import { StyledContainer } from '../editor-examples.styles';

/** 基于tr.getMeta决定add/remove decoration
 * - 每次都要用decorationSet.map()更新decos的视图和位置
 */
const placeholderPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, set) {
      // Adjust decoration positions to changes made by the transaction
      set = set.map(tr.mapping, tr.doc);
      // See if the transaction adds or removes any placeholders
      // @ts-expect-error this应该指向当前Plugin对象 placeholderPlugin
      // const action = tr.getMeta(placeholderPlugin);
      const action = tr.getMeta(this);
      if (action && action.add) {
        const widget = document.createElement('placeholder');
        const deco = Decoration.widget(action.add.pos, widget, {
          id: action.add.id,
        });
        set = set.add(tr.doc, [deco]);
      }
      if (action && action.remove) {
        set = set.remove(
          set.find(null, null, (spec) => spec.id === action.remove.id),
        );
      }
      return set;
    },
  },
  props: {
    // the decorations prop simply returns the plugin state, causing the decorations to show up in the view.
    decorations(state) {
      // return placeholderPlugin.getState(state);
      return this.getState(state);
    },
  },
});

/** returns the current position of the placeholder with the given ID */
function findPlaceholder(state: EditorState, id: {}) {
  const decos = placeholderPlugin.getState(state);
  const found = decos.find(null, null, (spec) => spec.id === id);
  return found.length ? found[0].from : null;
}

/** 点击上传按钮时，先删除选区，然后在tr中设置add参数，dispatchTr, 此时会显示图片占位符decoId
 * - 接着触发上传异步逻辑
 * - 上传完成时，在state中找到decoId，将该位置替换为img-node，dispatchTr
 * - ❓ 为什么id不用字符串
 */
function startImageUpload(view: EditorView, file: File) {
  // A fresh object to act as the ID for this upload
  const id = {};

  // Replace the selection with a placeholder
  const tr = view.state.tr;
  if (!tr.selection.empty) tr.deleteSelection();
  tr.setMeta(placeholderPlugin, { add: { id, pos: tr.selection.from } });
  view.dispatch(tr);

  uploadFile(file).then(
    (url) => {
      const pos = findPlaceholder(view.state, id);
      // If content around the placeholder has been deleted, drop the image
      if (pos == null) return;
      // Otherwise, insert it at placeholder's position, and remove the placeholder
      view.dispatch(
        view.state.tr
          .replaceWith(pos, pos, schema.nodes.image.create({ src: url }))
          .setMeta(placeholderPlugin, { remove: { id } }),
      );
    },
    () => {
      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(placeholderPlugin, { remove: { id } }));
    },
  );
}

/** This is just a dummy that loads the file and creates a data URL.
 * You could swap it out with a function that does an actual upload
 * and returns a regular URL for the uploaded file.
 */
function uploadFile(file: File) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    // Some extra delay to make the asynchronicity visible
    setTimeout(() => reader.readAsDataURL(file), 2500);
  });
}

/**
 * ✨ 官方编辑器示例，利用decoration实现上传图片时显示占位符 。
 * - https://prosemirror.net/examples/upload/
 * - 上传图片时会先显示占位符，此时可编辑其他内容，待上传完成会用图片替换占位符
 *
 * - 👉🏻 本示例要点
 * - 上传图片时使用readAsDataURL将图片内容读取为dataUrl base64
 * - ❓ 图片上传完成后，点击图片会很卡，但点击编辑器其他位置文字时光标正常
 *   - 通过菜单工具条输入url添加的图片却能够正常点击选中
 *   - 初步分析，是上传的图片太大(90kb)编码成base64放在url里面造成的；但官网线上却无此问题
 *   - 👀 通过浏览器perf面板分析调用栈定位到问题，问题出在prosemirror-dev-toolkit
 */
export const ImageUploadApp = () => {
  const editorContainer = useRef<HTMLDivElement>();
  const initialContentContainer = useRef<HTMLDivElement>();
  const fileInput = useRef<HTMLInputElement>();
  const view = useRef<EditorView>(null);

  const handleFileInputChange: ChangeEventHandler<HTMLInputElement> =
    useCallback((event) => {
      if (
        view.current.state.selection.$from.parent.inlineContent &&
        event.target.files.length
      ) {
        startImageUpload(view.current, event.target.files[0]);
      }
      view.current.focus();
    }, []);

  useEffect(() => {
    const state = EditorState.create({
      doc: DOMParser.fromSchema(schema).parse(initialContentContainer.current),
      plugins: exampleSetup({ schema }).concat(placeholderPlugin),
    });

    view.current = new EditorView(editorContainer.current, {
      state,
    });
    // applyDevTools(view.current, { devToolsExpanded: false });

    return () => view.current.destroy();
  }, []);

  return (
    <div>
      <div>
        Insert image:
        <input
          ref={fileInput}
          onChange={handleFileInputChange}
          type='file'
          id='image-upload'
        />
      </div>
      <p />
      <div ref={editorContainer} id='editor' />
      {/* 👇🏻 剩下的全是默认隐藏的编辑器初始数据 */}
      <div ref={initialContentContainer} style={{ display: 'none' }}>
        <h3>Image Upload in ProseMirror</h3>
        <p>
          click in the editor and click the file input to upload a local img
        </p>
        <p />
        <p />
        <img
          src='https://www.yinxiang.com/new/wp-content/uploads/2019/12/EverPEN-Copy-20.png'
          alt=''
          title=''
          draggable='true'
        />
        <img
          src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAACXBIWXMAAAsTAAALEwEAmpwYAAACYElEQVR42u3dwW3bMBQGYC1gSSN4pNxE9uQN6g3SDZJbgEiysoGzQUfwCB7BI6RiA6QpUtSxDo5EfAT+u/E+kHqkYLEozox6uKnLNm6rvtlXfTiOeZEvzK45JItVHzb1Q1gXU0c9hHXZh0FR551kdDF0OXz7XvXxpIALgh7C7Sdx452CLRU53p3BDbcKtfwl+z/LsgLlgRy3Hxoqz9ycEk9/NV665YyX6tfZqyA5Jp1hFPW4YVaMTGdxOz6LLc8ZA3fNc/F69KUYmeZYOF/OO7MHTj3Cpal24SfcN+B573+nvCgpu/AE988MfgEMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwICzAl49hk1hXHVM/ZsvYMCAARuADcAGYMCAAQMGDBiwkgM2ABuzBE7foUqfQLxGphbjWr/vWpn67S+vC70uBAwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgOECBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAEDBgwYMGDAgAHPMKs+bC7N1AssAMsigY8KkWl28VBUXbNXjDxTds1zUbZxqxh5JvUjRT3c1IqRZ+qHsLatyHV5fn8tYD2EddXHk8JkOHvfkNvGszgX3Db8+PetnZbq5eN2zf2ZY754r1BLxQ1Pn7t/d5ziCrakxFM9bncvu2R5bLx018volj80VJdC/75evIv7qmsOivrlOSaLdECVzjDO+f0CCmhFXOcn7JsAAAAASUVORK5CYII='
          draggable='true'
        />
      </div>
    </div>
  );
};

// const StyledDemoContainer = styled(StyledContainer)`
//   placeholder {
//     display: inline;
//     border: 1px solid #ccc;
//     color: #ccc;
//   }
//   placeholder:after {
//     content: '☁';
//     font-size: 200%;
//     line-height: 0.1;
//     font-weight: bold;
//   }
//   .ProseMirror img {
//     max-width: 100px;
//   }
// `;
