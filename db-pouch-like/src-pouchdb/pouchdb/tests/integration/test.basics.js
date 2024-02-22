const adapters = ['http', 'local'];

adapters.forEach(function (adapter) {
  describe('test.basics.js-' + adapter, function () {
    const dbs = {};

    beforeEach(function () {
      dbs.name = testUtils.adapterUrl(adapter, 'testdb');
    });

    afterEach(function (done) {
      testUtils.cleanup([dbs.name], done);
    });

    // it('Create a pouch without new keyword', function () {
    //   const db = PouchDB(dbs.name);
    //   db.should.be.an.instanceof(PouchDB);
    // });

    it('Name is accessible via instance', function () {
      const db = new PouchDB(dbs.name);
      db.name.should.equal(dbs.name);
    });

    it('4314 Create a pouch with + in name', function () {
      const db = new PouchDB(dbs.name + '+suffix');
      return db.info().then(function () {
        return db.destroy();
      });
    });

    it('Creating Pouch without name will throw', function (done) {
      try {
        new PouchDB();
        done('Should have thrown');
      } catch (err) {
        should.equal(err instanceof Error, true, 'should be an error');
        done();
      }
    });
  });
});
