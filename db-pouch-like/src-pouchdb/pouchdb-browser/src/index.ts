import HttpPouch from 'pouchdb-adapter-http';
import IDBPouch from 'pouchdb-adapter-idb';
import PouchDB from 'pouchdb-core';
import mapreduce from 'pouchdb-mapreduce';
import replication from 'pouchdb-replication';

PouchDB.plugin(IDBPouch)
  .plugin(HttpPouch)
  .plugin(mapreduce)
  .plugin(replication);

export default PouchDB;
