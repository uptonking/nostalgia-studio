let hasLocal: boolean | undefined = undefined;

try {
  localStorage.setItem('_pouch_check_localstorage', '1');
  hasLocal = Boolean(localStorage.getItem('_pouch_check_localstorage'));
} catch (e) {
  hasLocal = false;
}

function hasLocalStorage() {
  return hasLocal;
}

export default hasLocalStorage;
