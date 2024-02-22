import { DOC_STORE } from './constants';

function countDocs(
  txn: {
    objectStore: (arg0: string) => {
      (): any;
      new (): any;
      index: { (arg0: string): any; new (): any };
    };
  },
  cb: { (count: any): void; (arg0: any): void },
) {
  const index = txn.objectStore(DOC_STORE).index('deletedOrLocal');
  index.count(IDBKeyRange.only('0')).onsuccess = function (e: any) {
    cb(e.target.result);
  };
}

export default countDocs;
