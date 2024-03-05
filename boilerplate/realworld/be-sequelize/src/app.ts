import cors from 'cors';
import express from 'express';
import logger from 'morgan';

import { dbSync } from './db/connection';
import { deserializeUser } from './middleware';
import { errorHandler } from './middleware/error';
import { appRouter } from './routes/v1';

const app = express();
app.use(cors());
// middleware to handle error
app.use(errorHandler);

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(deserializeUser);

/**
 * main app routes.
 */

app.use('/api/v1', appRouter);

/**
 * routes to test
 */

app.get('/api/', (req, res) => {
  res.status(200).json({ msg: 'server is up..', user: req.user });
});

/**
 * route to sync db
 */
app.patch('/api/sync', async (req, res) => {
  try {
    const sync = await dbSync();
    res.status(200).json({ ...sync, error: false });
  } catch (err) {
    console.log('ERR', err);
    let msg = 'Internal Server Error';
    if (err instanceof Error) {
      msg = err.message;
    } else if (err) {
      msg = err as string;
    }
    return res.status(400).json({ errorMsg: msg, error: true });
  }
});

/**
 * @swagger
 * tags:
 *   name: Global
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get server status
 *     description: Logged in users can fetch only their own user information.
 *     tags: [Global]
 *     responses:
 *       "200":
 *         description: OK
 *
 * /sync:
 *   patch:
 *     summary: Sync database
 *     description: To sync database first time and after change in model.
 *     tags: [Global]
 *     responses:
 *       "200":
 *         description: OK
 *
 */


app.set('port', process.env.PORT || 3000);

export { app };
