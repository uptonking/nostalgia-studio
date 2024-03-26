import { contentTypesSrv } from './content-types';
import { coreApi } from './core-api';
import { entityServiceDecorator } from './entity-service-decorator';
import { lifecycles } from './lifecycles';
import { permissions } from './permissions';

export const services = {
  permissions,
  'core-api': coreApi,
  'content-types': contentTypesSrv,
  lifecycles,
  'entity-service-decorator': entityServiceDecorator,
};

export default services;
