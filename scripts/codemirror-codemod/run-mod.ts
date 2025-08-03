import { homedir } from 'node:os';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { ensureDirSync, copy, moveSync } from 'fs-extra';
import { checkIfPathExist, dateNow } from './utils';
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
  // console.log(';; folders ', Array.isArray(folders), foldersToBackup);

  const cpFolder = async (src: string, dest: string) => {
    try {
      await copy(src, dest, { overwrite: true, preserveTimestamps: true });
    } catch (error) {
      console.warn(';; cpFolder failed ', src, dest, error);
    }
  };

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

/**
 * executing steps sequentially and separately is more reliable
 */
async function runMod() {
  // try {
  //   await backupAndUpdateCode();
  // } catch (error) {
  //   console.log(';; backupThenUpdateCode failed ', error);
  // }

  // formatCode(); // lint + format

  await patchCode();

  // tests
}

runMod();
