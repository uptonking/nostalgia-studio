import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import swaggerUI from 'swagger-ui-express';

import { bootstrap } from './config/bootstrap';
import swaggerDoc from './config/swagger.json' assert { type: 'json' };
import { authenticateUser } from './middlewares/auth';
import { appRouter } from './routes';
import { errorHandler } from './utils/error-handler';
import { apiLogger } from './utils/logger';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// log api request
app.use(apiLogger);

// authenticate middleware trying to add user to req
app.use(authenticateUser);

// routes
app.use('/api', appRouter);

// swagger documentation
app.use(
  '/api/docs',
  swaggerUI.serve,
  swaggerUI.setup(swaggerDoc, { explorer: false }),
);

app.use('/public', express.static('public/'));
app.use('/uploads', express.static('public/uploads/'));

app.get('/', (req: Request, res: Response) => {
  return res.status(200).send({ message: 'realworld server is running' });
});

// keep error-handler as last middleware
app.use(errorHandler);

// run bootstrap function before starting app
bootstrap(app);

export { app };
