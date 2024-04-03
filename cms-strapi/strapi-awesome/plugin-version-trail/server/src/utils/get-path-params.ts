import { match } from 'path-to-regexp';

export const getPathParams = (path, isAdmin) => {
  // take the path without the query string

  const _path = path.split('?')[0];

  const matchFn = isAdmin
    ? match('/content-manager/:collectionType/:contentTypeName/:contentTypeId?')
    : match('/api/:contentTypeName/:contentTypeId?');

  const matches = matchFn(_path);

  let params: Record<string, any> = {};
  if (typeof matches !== 'boolean') {
    params = matches.params;
  }

  return { ...params };
};
