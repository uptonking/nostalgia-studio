import { existsSync } from 'node:fs';
import { copy } from 'fs-extra';

export function checkIfPathExist(path: string) {
  if (existsSync(path)) {
    return true;
  }

  return false;
}

export const cpFolder = async (src: string, dest: string) => {
  try {
    await copy(src, dest, { overwrite: true, preserveTimestamps: true });
  } catch (error) {
    console.warn(';; cpFolder failed ', src, dest, error);
  }
};

export function dateNow() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
    .replace(/-|:/g, '');
}
