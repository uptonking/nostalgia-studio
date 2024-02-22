import pull from 'pull-stream';

/** Currently this uses pull streams, not levelup's readstream,
 * but in theory I should be able pretty much just drop that in.
 */
function pullReadStream(options, makeData) {
  const stream = pull.defer();
  stream.setIterator = function (iterator) {
    stream.resolve(function (end, cb) {
      if (!end) {
        iterator.next(function (err, key, value) {
          if (err) {
            return cb(err);
          }
          if (key === undefined || value === undefined) {
            return cb(true);
          }
          cb(null, makeData(key, value));
        });
      } else {
        iterator.end(cb);
      }
    });
  };

  return stream;
}
export default pullReadStream;
