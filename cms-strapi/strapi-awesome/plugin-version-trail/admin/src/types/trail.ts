export type Trail = {
  id: number;
  recordId: string;
  version: number;
  change: string;
  content: object;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  admin_user?: any;
  users_permissions_user?: any;
};
