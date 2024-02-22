import events from 'events';

import NotFoundError from './NotFoundError';

const EventEmitter = events.EventEmitter;

const version = '6.5.4';

const NOT_FOUND_ERROR = new NotFoundError();

const sublevel = function (nut, prefix, createStream, options) {
  const emitter = new EventEmitter() as InstanceType<typeof EventEmitter> & {
    sublevels: any;
    options: any;
    version: string;
    methods: any;
    prefix: any;
    put: any;
    get: any;
    batch: any;
    readStream: any;
    createReadStream: any;
    close: any;
    isOpen: any;
    isClosed: any;
    sublevel: any;
  };

  emitter.sublevels = {};
  emitter.options = options;
  emitter.version = version;
  emitter.methods = {};

  prefix = prefix || [];

  function mergeOpts(opts) {
    const o = {};
    let k;
    if (options) {
      for (k in options) {
        if (typeof options[k] !== 'undefined') {
          o[k] = options[k];
        }
      }
    }
    if (opts) {
      for (k in opts) {
        if (typeof opts[k] !== 'undefined') {
          o[k] = opts[k];
        }
      }
    }
    return o;
  }

  emitter.put = function (key, value, opts, cb) {
    if ('function' === typeof opts) {
      cb = opts;
      opts = {};
    }

    nut.apply(
      [
        {
          key,
          value,
          prefix: prefix.slice(),
          type: 'put',
        },
      ],
      mergeOpts(opts),
      function (err) {
        /* istanbul ignore next */
        if (err) {
          return cb(err);
        }
        emitter.emit('put', key, value);
        cb(null);
      },
    );
  };

  emitter.prefix = function () {
    return prefix.slice();
  };

  emitter.batch = function (ops, opts, cb) {
    if ('function' === typeof opts) {
      cb = opts;
      opts = {};
    }

    ops = ops.map(function (op) {
      return {
        key: op.key,
        value: op.value,
        prefix: op.prefix || prefix,
        keyEncoding: op.keyEncoding, // *
        valueEncoding: op.valueEncoding, // * (TODO: encodings on sublevel)
        type: op.type,
      };
    });

    nut.apply(ops, mergeOpts(opts), function (err) {
      /* istanbul ignore next */
      if (err) {
        return cb(err);
      }
      emitter.emit('batch', ops);
      cb(null);
    });
  };

  emitter.get = function (key, opts, cb) {
    /* istanbul ignore else */
    if ('function' === typeof opts) {
      cb = opts;
      opts = {};
    }
    nut.get(key, prefix, mergeOpts(opts), function (err, value) {
      if (err) {
        cb(NOT_FOUND_ERROR);
      } else {
        cb(null, value);
      }
    });
  };

  emitter.sublevel = function (name, opts) {
    return (emitter.sublevels[name] =
      emitter.sublevels[name] ||
      sublevel(nut, prefix.concat(name), createStream, mergeOpts(opts)));
  };

  emitter.readStream = emitter.createReadStream = function (opts) {
    opts = mergeOpts(opts);
    opts.prefix = prefix;
    let stream;
    const it = nut.iterator(opts);

    stream = createStream(opts, nut.createDecoder(opts));
    stream.setIterator(it);

    return stream;
  };

  emitter.close = function (cb) {
    nut.close(cb);
  };

  emitter.isOpen = nut.isOpen;
  emitter.isClosed = nut.isClosed;

  return emitter;
};

export default sublevel;
