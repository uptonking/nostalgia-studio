import PouchDB from 'pouchdb-browser';
import findPlugin from 'pouchdb-find';
import paginatorsPlugin from 'pouchdb-paginators';

PouchDB.plugin(findPlugin);
PouchDB.plugin(paginatorsPlugin);

export default PouchDB;
