// throw an error if any EventEmitter adds too many listeners
import 'throw-max-listeners-error';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { exec } from 'child_process';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { dirname } from 'path';
import seedrandom from 'seedrandom';
import { fileURLToPath } from 'url';

import { testUtils } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

chai.use(chaiAsPromised);
globalThis.should = chai.should();
globalThis.assert = chai.assert;

globalThis.fs = fs;
globalThis.__dirname = __dirname;

globalThis.testUtils = testUtils;

globalThis.PouchDB = testUtils.loadPouchDB();

const seed = String(process.env.SEED || Date.now());
console.log('Seeded with: ' + seed);
seedrandom(seed, { global: true });

const testsDir = process.env.TESTS_DIR || './tmp';

function cleanup() {
  // Remove test databases
  exec('rm -r ' + testsDir);
}

exec('mkdir -p ' + testsDir, function () {
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);
});

mkdirp.sync('./tmp');
