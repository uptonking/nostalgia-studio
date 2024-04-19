import 'quill/styles/quill.snow.css';
import '../src/styles.scss';

import { createNoseditor } from '../src';

const ql = createNoseditor({
  container: '#root',
});

window['ql'] = ql;
