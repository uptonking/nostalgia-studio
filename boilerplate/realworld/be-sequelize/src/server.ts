import errorHandler from 'errorhandler';

import { app } from './app';

if (process.env.NODE_ENV === 'development') {
  // Development-only error handler. provide full error stack traces
  app.use(errorHandler());
}

export const server = app.listen(app.get('port'), () => {
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

export default server;
