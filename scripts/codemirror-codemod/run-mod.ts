import { homedir } from 'node:os';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { ensureDirSync, copy, moveSync } from 'fs-extra';
import { checkIfPathExist, cpFolder, dateNow } from '../utils/common';
import { patchCode } from './code-patch-mod';

async function backupAndUpdateCode(backupFolderName = dateNow()) {
  const homeDir = homedir();
  const latestCodeFolder = path.join(homeDir, 'gh-mirror/codemirror');

  if (!checkIfPathExist(latestCodeFolder)) {
    throw new Error(`Latest code for ${latestCodeFolder} does not exist`);
  }

  const backupFolderSrcParent = path.resolve(
    import.meta.dirname,
    `../../editor-codemirror/src-pkgs`,
  );
  // console.log(';; backupFolderSrcParent ', backupFolderSrcParent);

  const backupFolderDest = path.resolve(
    import.meta.dirname,
    `../../editor-codemirror/-bak-cm-${backupFolderName}`,
  );
  ensureDirSync(backupFolderDest);
  // console.log(';; backupFolderDest ', backupFolderDest);
  // console.log(';; latestCodeFolder ', latestCodeFolder);

  const folders = readdirSync(backupFolderSrcParent);

  const foldersToBackup = folders.filter(
    (file) =>
      !['git-conflicts', 'legacy-modes', 'merge-diff', '.DS_Store'].includes(
        file,
      ),
  );
  // console.log(';; folders ', foldersToBackup.length, foldersToBackup);

  // backup code from this repo
  await Promise.allSettled(
    foldersToBackup.map((folder) =>
      cpFolder(
        path.join(backupFolderSrcParent, folder, 'src'),
        path.join(backupFolderDest, folder, 'src'),
      ),
    ),
  );

  // backup other code
  await cpFolder(
    path.join(backupFolderSrcParent, 'legacy-modes', 'mode'),
    path.join(backupFolderDest, 'legacy-modes', 'mode'),
  );

  const latestFolders = foldersToBackup.filter(
    (folder) => !['codemirror'].includes(folder),
  );

  // update latest code to this repo
  await Promise.allSettled(
    latestFolders.map((folder) =>
      cpFolder(
        path.join(latestCodeFolder, folder, 'src'),
        path.join(backupFolderSrcParent, folder, 'src'),
      ),
    ),
  );

  // update other code
  await cpFolder(
    path.join(latestCodeFolder, 'legacy-modes', 'mode'),
    path.join(backupFolderSrcParent, 'legacy-modes', 'mode'),
  );
  await cpFolder(
    path.join(latestCodeFolder, 'basic-setup', 'src'),
    path.join(backupFolderSrcParent, 'codemirror', 'src'),
  );
}

function formatCode() {}

async function replaceFilesBeforePatch() {
  const projectRoot = path.resolve(import.meta.dirname, `../..`);
  const filesToReplace = [
    {
      src: `${projectRoot}/scripts/codemirror-codemod/replacements/language-data.ts`,
      dest: `${projectRoot}/editor-codemirror/src-pkgs/language-data/src/language-data.ts`,
    },
  ];
  // console.log(';; filesToReplace ', filesToReplace);

  const cpFile = async (src: string, dest: string) => {
    try {
      await copy(src, dest, { overwrite: true, preserveTimestamps: true });
    } catch (error) {
      console.warn(';; cpFile failed ', src, dest, error);
    }
  };

  await Promise.allSettled(
    filesToReplace.map((file) => cpFile(file.src, file.dest)),
  );
}

/**
 * executing steps sequentially and separately is more reliable
 */
async function runMod() {
  // try {
  //   await backupAndUpdateCode();
  // } catch (error) {
  //   console.log(';; backupThenUpdateCode failed ', error);
  // }

  // await replaceFilesBeforePatch();

  // formatCode(); // lint + format

  await patchCode();

  // tests
}

runMod();
