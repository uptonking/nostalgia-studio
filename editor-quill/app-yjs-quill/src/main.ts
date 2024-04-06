import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { QuillBinding } from 'y-quill';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

// import 'quill/styles/quill.snow.css';

const rootElem = document.querySelector('#app') as HTMLElement;

Quill.register('modules/cursors', QuillCursors as any);

const quill = new Quill(rootElem, {
  modules: {
    cursors: true,
    toolbar: false,
    //  [
    //   [{ header: [1, 2, false] }],
    //   ['bold', 'italic', 'underline'],
    //   ['image', 'code-block'],
    // ],
    history: {
      userOnly: true, // 用户自己实现历史记录
    },
  },
  placeholder: 'hello, it is quill editor...',
  theme: 'snow',
});

const ydoc = new Y.Doc(); // y 文档对象，保存需要共享的数据
const ytext = ydoc.getText('quill'); // 创建名为 quill 的 Text 对象

// 连接到 websocket 服务端
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'quill-demo-room',
  ydoc,
);

// 数据模型绑定，再绑上光标对象
const binding = new QuillBinding(ytext, quill, provider.awareness);
