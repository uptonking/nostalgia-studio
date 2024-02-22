import pouchChangesFilter from 'pouchdb-changes-filter';

import PouchDB from './setup-after';

// TODO: remove from pouchdb-core (breaking)
PouchDB.plugin(pouchChangesFilter);

export default PouchDB;
