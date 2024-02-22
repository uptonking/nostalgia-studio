import Codec from 'level-codec';

import precodec from './legacyCodec';
import nut from './nut';
import ReadStream from './readStream';
import shell from './shell';

// @ts-expect-error fix-types
const codec = new Codec();

function sublevelPouch(db) {
  return shell(nut(db, precodec, codec), [], ReadStream, db.options);
}

export default sublevelPouch;
