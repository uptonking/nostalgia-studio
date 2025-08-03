import { run as jscodeshift } from 'jscodeshift/src/Runner';
import path from 'node:path';

async function removeDeclareFromClassField() {
  const transformPath = path.resolve(
    import.meta.dirname,
    'transforms/class-field-remove-declare.ts',
  );
  const codemirrorProjectRoot = path.resolve(
    import.meta.dirname,
    '../../editor-codemirror/src-pkgs',
  );
  const paths = [`${codemirrorProjectRoot}/view/src/editorview.ts`];
  const options = {
    dry: false,
    print: false,
    verbose: 1,
  };
  // console.log(';; mod-transformPath ', transformPath, codemirrorProjectRoot);

  try {
    const res = await jscodeshift(transformPath, paths, options);
    // console.log(';; mod-res ', res);
  } catch (e) {
    console.log(';; jscodeshift transform error ', e);
  }
}

export async function patchCode() {
  try {
    await removeDeclareFromClassField();
  } catch (error) {
    console.error('Error in patchCode:', error);
  }
}
