import permissions from './permissions';
import { coreApi } from './core-api';
import contentTypes from './content-types';
import { lifecycles } from './lifecycles';
import entityServiceDecorator from './entity-service-decorator';

export const services = {
  permissions,
  'core-api': coreApi,
  'content-types': contentTypes,
  lifecycles: lifecycles,
  'entity-service-decorator': entityServiceDecorator,
};

export default services;
