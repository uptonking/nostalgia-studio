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
  'password', // For security
];

export const prepareTrailFromSchema = (update, schema) => {
  /**
   * Walk the update object and create our trail
   */
  const trail = {};
  const ignored = {};
  if (!_.isEmpty(update)) {
    Object.keys(update).map((key) => {
      if (schema.attributes.hasOwnProperty(key) && !ignoreProps.includes(key)) {
        trail[key] = update[key];
      } else {
        ignored[key] = update[key];
      }

      return key;
    });
  }

  return { trail, ignored };
};
