export enum ROLE {
  ADMIN = 'ADMIN',
  AUTHENTICATED = 'AUTHENTICATED',
  PUBLIC = 'PUBLIC',
}

export function omit(obj: Record<string, unknown>, props: string[]) {
  const _obj = { ...obj };
  props.forEach((prop) => delete _obj[prop]);
  return _obj;
}

export function get(obj: object, path?, defValue?) {
  if (!path) return undefined;

  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  const result = pathArray.reduce(
    (prevObj, key) => prevObj && prevObj[key],
    obj,
  );

  return result === undefined ? defValue : result;
}
