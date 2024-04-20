import 'quill/styles/quill.snow.css';
import '../src/styles.scss';

import { createNoseditor } from '../src';

const qs = document.querySelector.bind(document);

const ql = createNoseditor({
  container: '#root',
});

window['ql'] = ql;

ql.on('selection-change', (range, oldRange) => {
  console.log(';; on-sel ', JSON.stringify(range), JSON.stringify(oldRange));
});

ql.on('text-change', (delta, oldDelta, source) => {
  console.log(';; on-chg ', JSON.stringify(delta), source, ql.getSelection());
  Promise.resolve().then(() => {
    console.log('chg ', delta, source, JSON.stringify(ql.getSelection()));
  });

  qs('.editorDelta').innerHTML = JSON.stringify(ql.getContents());
});
