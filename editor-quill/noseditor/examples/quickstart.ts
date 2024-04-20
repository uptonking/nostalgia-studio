import 'quill/styles/quill.snow.css';
import '../src/styles.scss';

import { createNoseditor } from '../src';

const ql = createNoseditor({
  container: '#root',
});

window['ql'] = ql;

// ql.on('selection-change', (range, oldRange) => {
//   console.log(';; on-sel ', range, oldRange);
// });

// ql.on('text-change', (delta, oldDelta, source) => {
//   console.log(';; on-chg ', delta, source, ql.getSelection());
//   Promise.resolve().then(() => {
//     console.log('chg ', delta, source, ql.getSelection());
//   });
// });
