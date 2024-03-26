import type { contentTypesSrv } from '../services/content-types';
import type { coreApi } from '../services/core-api';
import type { entityServiceDecorator } from '../services/entity-service-decorator';
import type { lifecycles } from '../services/lifecycles';
import type { permissions } from '../services/permissions';

export type ServiceTypes = {
  permissions: typeof permissions;
  lifecycles: typeof lifecycles;
  ['content-types']: typeof contentTypesSrv;
  ['core-api']: typeof coreApi;
  ['entity-service-decorator']: typeof entityServiceDecorator;
};
