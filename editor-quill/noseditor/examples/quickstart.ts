import 'quill/styles/quill.snow.css';

import { createNoseditor } from '../src';

const ql = createNoseditor({
  container: '#root',
});

window['ql'] = ql;
