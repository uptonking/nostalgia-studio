const changeTypes = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

export const getChangeType = (method) => {
  return changeTypes[method];
};
