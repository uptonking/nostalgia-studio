import { usersPermModelName } from '../utils/plugin-getter-names';

export const userPermissionSchema = {
  users_permissions_user: {
    type: 'relation',
    relation: 'oneToOne',
    target: usersPermModelName,
  },
};
