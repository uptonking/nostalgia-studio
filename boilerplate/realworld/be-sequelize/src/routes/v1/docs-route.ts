import { Router } from 'express';
import swaggerJSDocs from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { swaggerOption } from '../../config/swagger';

const swaggerOpt = swaggerJSDocs(swaggerOption);

export const docsRouter = Router();

docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(swaggerOpt, { explorer: false }));

export default docsRouter;
