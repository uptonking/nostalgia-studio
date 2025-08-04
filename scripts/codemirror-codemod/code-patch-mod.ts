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
  const paths = [
    `${codemirrorProjectRoot}/state/src/change.ts`,
    `${codemirrorProjectRoot}/state/src/facet.ts`,
    `${codemirrorProjectRoot}/state/src/rangeset.ts`,
    `${codemirrorProjectRoot}/state/src/text.ts`,
    `${codemirrorProjectRoot}/state/src/transaction.ts`,
    `${codemirrorProjectRoot}/view/src/editorview.ts`,
    `${codemirrorProjectRoot}/view/src/contentview.ts`,
    `${codemirrorProjectRoot}/view/src/inlineview.ts`,
    `${codemirrorProjectRoot}/view/src/docview.ts`,
    `${codemirrorProjectRoot}/view/src/decoration.ts`,
    `${codemirrorProjectRoot}/view/src/gutter.ts`,
    `${codemirrorProjectRoot}/view/src/heightmap.ts`,
    `${codemirrorProjectRoot}/view/src/placeholder.ts`,
    `${codemirrorProjectRoot}/view/src/tooltip.ts`,
    `${codemirrorProjectRoot}/view/src/viewstate.ts`,
    // unnecessary to remove declare
    // `${codemirrorProjectRoot}/view/src/blockview.ts`,
  ];
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
    console.log(';; jscodeshift removeDeclareFromClassField error ', e);
  }
}

async function addDeclareToClassField() {
  const transformPath = path.resolve(
    import.meta.dirname,
    'transforms/class-field-add-declare.ts',
  );
  const codemirrorProjectRoot = path.resolve(
    import.meta.dirname,
    '../../editor-codemirror/src-pkgs',
  );
  const filesSrc = [
    {
      path: `${codemirrorProjectRoot}/view/src/heightmap.ts`,
      className: 'HeightMapBranch',
      fieldName: 'size',
    },
    {
      path: `${codemirrorProjectRoot}/view/src/docview.ts`,
      className: 'DocView',
      fieldName: 'dom',
    },
    {
      path: `${codemirrorProjectRoot}/view/src/inlineview.ts`,
      className: 'TextView',
      fieldName: 'dom',
    },
    {
      path: `${codemirrorProjectRoot}/view/src/inlineview.ts`,
      className: 'MarkView',
      fieldName: 'dom',
    },
    {
      path: `${codemirrorProjectRoot}/view/src/inlineview.ts`,
      className: 'WidgetView',
      fieldName: 'dom',
    },
    {
      path: `${codemirrorProjectRoot}/view/src/inlineview.ts`,
      className: 'WidgetBufferView',
      fieldName: 'dom',
    },
  ];
  const options = {
    dry: false,
    print: false,
    verbose: 1,
    filesSrc,
  };
  // console.log(';; mod-filesToAddDeclare ', filesSrc, codemirrorProjectRoot);

  try {
    const res = await jscodeshift(
      transformPath,
      filesSrc.map((item) => item.path),
      options,
    );
    // console.log(';; mod-res ', res);
  } catch (e) {
    console.log(';; jscodeshift addDeclareToClassField error ', e);
  }
}

export async function patchCode() {
  try {
    await removeDeclareFromClassField();
    await addDeclareToClassField();
  } catch (error) {
    console.error('Error in patchCode:', error);
  }
}
