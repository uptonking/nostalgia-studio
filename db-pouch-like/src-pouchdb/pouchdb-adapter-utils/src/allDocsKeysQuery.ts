function allDocsKeysQuery(api, opts) {
  const keys = opts.keys;
  const finalResults: Record<string, any> = {
    offset: opts.skip,
  };
  return Promise.all(
    keys.map(function (key) {
      const subOpts = { key, deleted: 'ok', ...opts };
      ['limit', 'skip', 'keys'].forEach(function (optKey) {
        delete subOpts[optKey];
      });
      return new Promise(function (resolve, reject) {
        api._allDocs(subOpts, function (err, res) {
          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }
          /* istanbul ignore if */
          if (opts.update_seq && res.update_seq !== undefined) {
            finalResults.update_seq = res.update_seq;
          }
          finalResults.total_rows = res.total_rows;
          resolve(res.rows[0] || { key, error: 'not_found' });
        });
      });
    }),
  ).then(function (results) {
    finalResults.rows = results;
    return finalResults;
  });
}

export default allDocsKeysQuery;
