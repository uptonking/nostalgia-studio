import { run as jscodeshift } from 'jscodeshift/src/Runner';
import path from 'node:path';

async function removeDeclareFromClassField() {
  const transformPath = path.resolve(
    import.meta.dirname,
    'transforms/class-field-remove-declare.ts',
  );
  const prosemirrorProjectRoot = path.resolve(
    import.meta.dirname,
    '../../editor-prosemirror/src-pkgs',
  );
  const paths = [
    // `${prosemirrorProjectRoot}/state/src/text.ts`,
    `${prosemirrorProjectRoot}/state/src/transaction.ts`,
    // `${prosemirrorProjectRoot}/view/src/editorview.ts`,
    // `${prosemirrorProjectRoot}/view/src/contentview.ts`,
    // unnecessary to remove declare
    // `${prosemirrorProjectRoot}/view/src/blockview.ts`,
  ];
  const options = {
    dry: false,
    print: false,
    verbose: 1,
  };
  // console.log(';; mod-transformPath ', transformPath, prosemirrorProjectRoot);

  try {
    const res = await jscodeshift(transformPath, paths, options);
    // console.log(';; mod-res ', res);
  } catch (e) {
    console.warn(';; jscodeshift removeDeclareFromClassField error ', e);
  }
}

async function assignClassFieldValue() {
  const transformPath = path.resolve(
    import.meta.dirname,
    'transforms/class-field-assign-value.ts',
  );
  const prosemirrorProjectRoot = path.resolve(
    import.meta.dirname,
    '../../editor-prosemirror/src-pkgs',
  );
  const filesSrc = [
    // {
    //   path: `${prosemirrorProjectRoot}/state/src/rangeset.ts`,
    //   className: 'RangeValue',
    //   fieldName: 'point',
    //   fieldValue: false,
    // },
    // {
    //   path: `${prosemirrorProjectRoot}/view/src/gutter.ts`,
    //   className: 'GutterMarker',
    //   fieldName: 'startSide',
    //   fieldValue: -1,
    //   addFieldIfNotExist: true,
    // },
    // {
    //   path: `${prosemirrorProjectRoot}/view/src/gutter.ts`,
    //   className: 'GutterMarker',
    //   fieldName: 'endSide',
    //   fieldValue: -1,
    //   addFieldIfNotExist: true,
    // },
    // {
    //   path: `${prosemirrorProjectRoot}/view/src/gutter.ts`,
    //   className: 'GutterMarker',
    //   fieldName: 'mapMode',
    //   fieldValue: 'MapMode.TrackBefore',
    //   addFieldIfNotExist: true,
    //   literalFieldValue: true,
    // },
  ];
  const options = {
    dry: false,
    print: false,
    verbose: 1,
    filesSrc,
  };
  // console.log(';; mod-filesToAssignField ', filesSrc, prosemirrorProjectRoot);

  try {
    const res = await jscodeshift(
      transformPath,
      filesSrc.map((item) => item.path),
      options,
    );
    // console.log(';; mod-res ', res);
  } catch (e) {
    console.warn(';; jscodeshift assignClassFieldValue error ', e);
  }
}

export async function patchCode() {
  try {
    await removeDeclareFromClassField();
    await assignClassFieldValue();
  } catch (error) {
    console.error('Error in patchCode:', error);
  }
}
