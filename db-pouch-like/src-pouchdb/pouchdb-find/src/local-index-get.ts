import { compare } from 'pouchdb-selector-core';

import { flatten } from './utils';
import { massageIndexDef } from './local-utils';

function getIndexes(db) {
  // just search through all the design docs and filter in-memory.
  // hopefully there aren't that many ddocs.
  return db
    .allDocs({
      startkey: '_design/',
      endkey: '_design/\uffff',
      include_docs: true,
    })
    .then(function (allDocsRes) {
      const res = {
        indexes: [
          {
            ddoc: null,
            name: '_all_docs',
            type: 'special',
            def: {
              fields: [{ _id: 'asc' }],
            },
          },
        ],
      };

      res.indexes = flatten(
        res.indexes,
        allDocsRes.rows
          .filter(function (row) {
            return row.doc.language === 'query';
          })
          .map(function (row) {
            const viewNames =
              row.doc.views !== undefined ? Object.keys(row.doc.views) : [];

            return viewNames.map(function (viewName) {
              const view = row.doc.views[viewName];
              return {
                ddoc: row.id,
                name: viewName,
                type: 'json',
                def: massageIndexDef(view.options.def),
              };
            });
          }),
      );

      // these are sorted by view name for some reason
      res.indexes.sort(function (left, right) {
        return compare(left.name, right.name);
      });
      // @ts-expect-error fix-types
      res.total_rows = res.indexes.length;
      return res;
    });
}

export default getIndexes;
