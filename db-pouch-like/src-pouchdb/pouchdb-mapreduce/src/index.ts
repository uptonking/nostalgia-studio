import evalFunction from './evalFunction';
import sum from './sum';
import { NotFoundError } from 'pouchdb-mapreduce-utils';
import createAbstractMapReduce from 'pouchdb-abstract-mapreduce';

const builtInReduce = {
  _sum: function (keys, values) {
    return sum(values);
  },

  _count: function (keys, values) {
    return values.length;
  },

  _stats: function (keys, values) {
    // no need to implement rereduce=true, because Pouch
    // will never call it
    function sumsqr(values) {
      let _sumsqr = 0;
      for (let i = 0, len = values.length; i < len; i++) {
        const num = values[i];
        _sumsqr += num * num;
      }
      return _sumsqr;
    }
    return {
      sum: sum(values),
      min: Math.min.apply(null, values),
      max: Math.max.apply(null, values),
      count: values.length,
      sumsqr: sumsqr(values),
    };
  },
};

function getBuiltIn(reduceFunString) {
  if (/^_sum/.test(reduceFunString)) {
    return builtInReduce._sum;
  } else if (/^_count/.test(reduceFunString)) {
    return builtInReduce._count;
  } else if (/^_stats/.test(reduceFunString)) {
    return builtInReduce._stats;
  } else if (/^_/.test(reduceFunString)) {
    throw new Error(reduceFunString + ' is not a supported reduce function.');
  }
}

function mapper(mapFun, emit) {
  // for temp_views one can use emit(doc, emit), see #38
  if (typeof mapFun === 'function' && mapFun.length === 2) {
    const origMap = mapFun;
    return function (doc) {
      return origMap(doc, emit);
    };
  } else {
    return evalFunction(mapFun.toString(), emit);
  }
}

function reducer(reduceFun) {
  const reduceFunString = reduceFun.toString();
  const builtIn = getBuiltIn(reduceFunString);
  if (builtIn) {
    return builtIn;
  } else {
    return evalFunction(reduceFunString);
  }
}

function ddocValidator(ddoc, viewName) {
  const fun = ddoc.views && ddoc.views[viewName];
  if (typeof fun.map !== 'string') {
    throw new NotFoundError(
      'ddoc ' +
        ddoc._id +
        ' has no string view named ' +
        viewName +
        ', instead found object of type: ' +
        typeof fun.map,
    );
  }
}

const localDocName = 'mrviews';
const abstract = createAbstractMapReduce(
  localDocName,
  mapper,
  reducer,
  ddocValidator,
);

function query(fun, opts, callback) {
  // @ts-expect-error fix-types
  return abstract.query.call(this, fun, opts, callback);
}

function viewCleanup(callback) {
  // @ts-expect-error fix-types
  return abstract.viewCleanup.call(this, callback);
}

export default {
  query,
  viewCleanup,
};
