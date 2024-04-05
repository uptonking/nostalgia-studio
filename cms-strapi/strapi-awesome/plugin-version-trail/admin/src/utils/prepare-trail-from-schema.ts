import _ from 'lodash';

/**
 * Ignore the default strapi fields to focus on custom fields
 */
const ignoreProps = [
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  // 'password', // For security
];

/**
 * Walk the update object and create our trail with non-system fields
 */
export const prepareTrailFromSchema = (update, schema) => {
  const trail = {};
  const ignored = {};
  if (!_.isEmpty(update)) {
    Object.keys(update).forEach((key) => {
      if (schema.attributes.hasOwnProperty(key) && !ignoreProps.includes(key)) {
        trail[key] = update[key];
      } else {
        ignored[key] = update[key];
      }
    });
  }

  return { trail, ignored };
};
