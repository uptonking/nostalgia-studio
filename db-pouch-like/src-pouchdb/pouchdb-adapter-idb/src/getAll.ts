// simple shim for objectStore.getAll(), falling back to IDBCursor
function getAll(
  objectStore: {
    getAll: (arg0: any) => { (): any; new (): any; onsuccess: any };
    openCursor: (arg0: any) => {
      (): any;
      new (): any;
      onsuccess: (e: any) => void;
    };
  },
  keyRange: any,
  onSuccess: {
    (e: { target: { result: any } }): void;
    (arg0: { target: { result: any[] } }): void;
  },
) {
  if (typeof objectStore.getAll === 'function') {
    // use native getAll
    objectStore.getAll(keyRange).onsuccess = onSuccess;
    return;
  }
  // fall back to cursors
  const values: any[] = [];

  function onCursor(e: { target: { result: any } }) {
    const cursor = e.target.result;
    if (cursor) {
      values.push(cursor.value);
      cursor.continue();
    } else {
      onSuccess({
        target: {
          result: values,
        },
      });
    }
  }

  objectStore.openCursor(keyRange).onsuccess = onCursor;
}

export default getAll;
