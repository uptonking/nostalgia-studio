/** Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

// NOTE: we are fixed to readable-stream@1.0.x for now
// for pure Streams2 across Node versions
import ReadableStreamCore from 'readable-stream';

const Readable = ReadableStreamCore.Readable;

function createClass(parent, init) {
  const klass = function (...args) {
    // @ts-expect-error fix-types
    if (!(this instanceof klass)) {
      // @ts-expect-error fix-types
      return new klass(...args);
    }
    // @ts-expect-error fix-types
    init.apply(this, args);
  };
  klass.prototype = Object.create(parent.prototype, {
    constructor: { value: klass },
  });
  return klass;
}

class ReadStreamInternal extends Readable {
  _waiting: boolean;
  _options: any;
  _makeData: any;
  _iterator: any;
  _destroyed: any;

  constructor(options, makeData) {
    super({ objectMode: true, highWaterMark: options.highWaterMark });
    this._setup(options, makeData);
  }

  _setup(options, makeData) {
    super.constructor({
      objectMode: true,
      highWaterMark: options.highWaterMark,
    });

    // purely to keep `db` around until we're done so it's not GCed if the user doesn't keep a ref
    this._waiting = false;
    this._options = options;
    this._makeData = makeData;
  }

  setIterator(it) {
    this._iterator = it;
    /* istanbul ignore if */
    if (this._destroyed) {
      return it.end(function () {});
    }
    /* istanbul ignore if */
    if (this._waiting) {
      this._waiting = false;
      return this._read();
    }
    return this;
  }

  _cleanup(err?) {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;

    const self = this;
    /* istanbul ignore if */
    if (err && err.message !== 'iterator has ended') {
      self.emit('error', err);
    }

    /* istanbul ignore else */
    if (self._iterator) {
      self._iterator.end(function () {
        self._iterator = null;
        self.emit('close', undefined);
      });
    } else {
      self.emit('close', undefined);
    }
  }
  emit(arg0: string, err: any) {
    throw new Error('Method not implemented.');
  }

  destroy() {
    this._cleanup();
  }

  _read() {
    const self = this;
    /* istanbul ignore if */
    if (self._destroyed) {
      return;
    }
    /* istanbul ignore if */
    if (!self._iterator) {
      return (this._waiting = true);
    }

    self._iterator.next(function (err, key, value) {
      if (err || (key === undefined && value === undefined)) {
        if (!err && !self._destroyed) {
          self.push(null);
        }
        return self._cleanup(err);
      }

      value = self._makeData(key, value);
      if (!self._destroyed) {
        self.push(value);
      }
    });
  }
  push(arg0: null) {
    throw new Error('Method not implemented.');
  }
}

const ReadStream = createClass(
  ReadStreamInternal,
  function (options, makeData) {
    // @ts-expect-error fix-types
    ReadStreamInternal.prototype._setup.call(this, options, makeData);
  },
);

export default ReadStream;
