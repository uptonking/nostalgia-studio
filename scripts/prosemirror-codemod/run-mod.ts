import { homedir } from 'node:os';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { ensureDirSync, copy, moveSync } from 'fs-extra';
import { checkIfPathExist, cpFolder, dateNow } from '../utils/common';
import { patchCode } from './code-patch-mod';

async function backupAndUpdateCode(backupFolderName = dateNow()) {
  const homeDir = homedir();
  const latestCodeFolder = path.join(homeDir, 'gh-mirror/ProseMirror');

  if (!checkIfPathExist(latestCodeFolder)) {
    throw new Error(`Latest code for ${latestCodeFolder} does not exist`);
  }

  const backupFolderSrcParent = path.resolve(
    import.meta.dirname,
    `../../editor-prosemirror/src-pkgs`,
  );
  console.log(';; backupFolderSrcParent ', backupFolderSrcParent);

  const backupFolderDest = path.resolve(
    import.meta.dirname,
    `../../editor-prosemirror/-bak-pm-${backupFolderName}`,
  );
  ensureDirSync(backupFolderDest);
  console.log(';; backupFolderDest ', backupFolderDest);
  console.log(';; latestCodeFolder ', latestCodeFolder);

  const folders = readdirSync(backupFolderSrcParent);

  const foldersToBackup = folders.filter(
    (file) => !['orderedmap', '.DS_Store'].includes(file),
  );
  console.log(';; folders ', foldersToBackup.length, foldersToBackup);

  // backup code from this repo
  await Promise.allSettled(
    foldersToBackup.map((folder) =>
      cpFolder(
        path.join(backupFolderSrcParent, folder, 'src'),
        path.join(backupFolderDest, folder, 'src'),
      ),
    ),
  );

  const latestFolders = foldersToBackup.filter(
    (folder) => !['prosemirror'].includes(folder),
  );
  console.log(';; latestFolders ', latestFolders.length, latestFolders);

  // update latest code to this repo
  await Promise.allSettled(
    latestFolders.map((folder) =>
      cpFolder(
        path.join(latestCodeFolder, `prosemirror-${folder}`, 'src'),
        path.join(backupFolderSrcParent, folder, 'src'),
      ),
    ),
  );

  // update other code
  const stylesToUpdate = [
    'view',
    'example-setup',
    'gapcursor',
    'menu',
    'search',
    'tables',
  ];
  await Promise.allSettled(
    stylesToUpdate.map((folder) =>
      cpFolder(
        path.join(latestCodeFolder, `prosemirror-${folder}`, 'style'),
        path.join(backupFolderSrcParent, folder, 'style'),
      ),
    ),
  );
}

function formatCode() {}

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
