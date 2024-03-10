import type { Application } from 'express';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */
export const bootstrap = async (app: Application): Promise<void> => {};
