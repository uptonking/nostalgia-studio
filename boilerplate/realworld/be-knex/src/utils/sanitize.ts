import pick from 'lodash/pick';

const templates: {
  [key: string]: string[];
} = {
  users: ['id', 'role', 'username', 'email', 'name', 'image'],
};

export const sanitizeEntity = (
  data: unknown,
  model: string,
): Partial<unknown> => {
  return pick(data, templates[model]);
};
