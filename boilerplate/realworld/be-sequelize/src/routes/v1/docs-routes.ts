import { Router } from 'express';
import swaggerJSDocs from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { swaggerOption } from '../../config/option';

const swaggerSpec = swaggerJSDocs(swaggerOption);

export const docsRouter = Router();

docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(swaggerSpec, { explorer: true }));

export default docsRouter;
