import { bootstrap } from './bootstrap';
import { config } from './config';
import { controllers } from './controllers';
import { destroy } from './destroy';
import { register } from './register';
import { routes } from './routes';
import { services } from './services';

export default {
  bootstrap,
  destroy,
  register,

  config,
  controllers,
  routes,
  services,
  contentTypes: {},
  policies: {},
  middlewares: {},
};
