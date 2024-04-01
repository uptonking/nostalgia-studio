import { bootstrap } from './bootstrap';
import { config } from './config';
import { contentTypes } from './content-types';
import { destroy } from './destroy';
import { middlewares } from './middlewares';
import { register } from './register';
import { services } from './services';

export default {
  bootstrap,
  destroy,
  register,

  config,
  services,
  contentTypes,
  middlewares,
};
