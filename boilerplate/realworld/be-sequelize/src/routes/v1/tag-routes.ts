import { Router } from 'express';

import { getAllTags } from '../../controllers/tag-controller';

export const tagRouter = Router();

tagRouter.get('/', getAllTags);

/**
 * @swagger
 * tags:
 *   name: Tag
 *   description: tags in articles
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get all tags
 *     description: Auth not required, returns a List of Tags
 *     tags: [Tag]
 *     requestBody:
 *       required: false
 *     responses:
 *       "200":
 *         description: OK
 *
 */
