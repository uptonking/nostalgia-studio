import { existsSync } from 'node:fs';

export function checkIfPathExist(path: string) {
  if (existsSync(path)) {
    return true;
  }

  return false;
}

export function dateNow() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
    .replace(/-|:/g, '');
}