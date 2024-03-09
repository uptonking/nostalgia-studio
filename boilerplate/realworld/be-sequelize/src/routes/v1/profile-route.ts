import { Router } from 'express';

import { getProfile } from '../../controllers/profile-controller';

export const profileRouter = Router();

// profileRouter.get("/:username", verifyToken, getProfile);
profileRouter.get('/:username', getProfile);
