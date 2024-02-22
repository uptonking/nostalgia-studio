function addOperation(type, key, value, options) {
  const operation: Record<string, any> = {
    type,
    key,
    value,
    options,
  };

  if (options && options.prefix) {
    operation.prefix = options.prefix;
    delete options.prefix;
  }

  // @ts-expect-error fix-types
  this._operations.push(operation);

  // @ts-expect-error fix-types
  return this;
}

function Batch(sdb) {
  // @ts-expect-error fix-types
  this._operations = [];
  // @ts-expect-error fix-types
  this._sdb = sdb;

  // @ts-expect-error fix-types
  this.put = addOperation.bind(this, 'put');
  // @ts-expect-error fix-types
  this.del = addOperation.bind(this, 'del');
}

const B = Batch.prototype;

B.clear = function () {
  this._operations = [];
};

B.write = function (cb) {
  this._sdb.batch(this._operations, cb);
};

export default Batch;
