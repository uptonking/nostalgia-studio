import 'dotenv/config';

import { app } from './app';
import { env } from './utils/env-helper';

const HOST = env.string('SERVER_HOST', 'localhost');
const PORT = env.number('SERVER_PORT', 8990);

app.set('port', PORT);

app.listen(PORT, HOST, () => {
  console.log(
    '\n  🚀 api server is running at http://localhost:%d in %s mode',
    app.get('port'),
    app.get('env'),
  );
  console.log(
    '  📄 api docs is available at http://localhost:%d/api/docs/',
    app.get('port'),
  );
  console.log('\n  Press CTRL-C to stop\n');
});
