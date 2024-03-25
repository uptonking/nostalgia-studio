import type * as contentTypes from '../services/content-types';
import type * as coreAPI from '../services/core-api';
import type * as lifecycles from '../services/lifecycles';
import type * as permissions from '../services/permissions';

export type ServiceTypes = {
  permissions: typeof permissions;
  lifecycles: typeof lifecycles;
  ['content-types']: typeof contentTypes;
  ['core-api']: typeof coreAPI;
  // fixme
  ['entity-service-decorator']: any;
};
