import { afterUpdate } from './after-update';
import { beforeCreate } from './before-create';
import { beforeDelete } from './before-delete';
import { beforeUpdate } from './before-update';

export const lifecycles = () => ({
  beforeCreate,
  beforeDelete,
  beforeUpdate,
  afterUpdate,
});

export default lifecycles;
