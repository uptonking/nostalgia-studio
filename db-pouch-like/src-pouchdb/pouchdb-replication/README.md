# pouchdb-replication

PouchDB's replication and sync algorithm, as a plugin.

### Usage

```bash
npm install pouchdb-replication
```

```js
PouchDB.plugin(require('pouchdb-replication'));
var db = new PouchDB('mydb');
db.replicate( /* see replicate/sync API docs for full info */ );
```

For full API documentation and guides on PouchDB, see [PouchDB.com](http://pouchdb.com/). For details on PouchDB sub-packages, see the [Custom Builds documentation](http://pouchdb.com/custom.html).
