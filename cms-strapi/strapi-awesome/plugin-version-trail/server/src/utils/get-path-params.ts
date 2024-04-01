import { match } from 'path-to-regexp';

export const getPathParams = (path, isAdmin) => {
  // take the path without the query string

  path = path.split('?')[0];

  const matchFn = isAdmin
    ? match('/content-manager/:collectionType/:contentTypeName/:contentTypeId?')
    : match('/api/:contentTypeName/:contentTypeId?');

  const matches = matchFn(path);

  // @ts-ignore
  const { params } = matches;

  return { ...params };
};
