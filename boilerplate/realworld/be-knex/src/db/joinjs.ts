/**
 * ResultMaps are used to teach JoinJS how to map database results to objects.
 * - Each result map focuses on a single object.
 */
export type ResultMap = {
  /** A unique identifier for the map */
  mapId: string;
  /** function that returns a blank new instance of the mapped object.
   * - Use this property to construct a custom object instead of a generic JavaScript `Object`. */
  createNew?: () => any;
  /** specifies the name of the id property in the mapped object and in the result set.
   * - Default is `id`, which implies that the name of the id property in the mapped
   *   object as well as the column name in the result set are both id.
   * - If the two names are different, then you must specify the Object form, e.g. `{name: 'id', column: 'person_id'}`.
   */
  idProperty?:
    | string
    | { name: string; column: string }
    | (string | { name: string; column: string })[];
  /** names of other properties.
   * - For any property that has a different name in the mapped object vs. the result set, you must specify the object form, e.g. {name: 'firstName', column: 'first_name'}
   */
  properties?: (
    | string
    | {
        name: string;
        column: string;
      }
  )[];
  /** mappings for associations to other objects  */
  associations?: {
    name: string;
    mapId: string;
    columnPrefix?: string;
  }[];
  /** mappings for collections of other objects */
  collections?: {
    name: string;
    mapId: string;
    columnPrefix?: string;
  }[];
};

/** Thrown when mapOne does not find an object in the resultSet and "isRequired" is passed in as true */
class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super();
    this.name = 'NotFoundError';
    this.message = message;
    this.stack = new Error().stack;
  }
}

/**
 * Maps a resultSet to an array of objects.
 *
 * @param {Array} resultSet - an array of database results
 * @param {Array} maps - an array of result maps
 * @param {String} mapId - mapId of the top-level objects in the resultSet
 * @param {String} [columnPrefix] - prefix that should be applied to the column names of the top-level objects
 * @returns {Array} array of mapped objects
 */
function map(
  resultSet: any[],
  maps: ResultMap[],
  mapId: string,
  columnPrefix?: string,
): any {
  const mappedCollection = [];

  resultSet.forEach((result) => {
    injectResultInCollection(
      result,
      mappedCollection,
      maps,
      mapId,
      columnPrefix,
    );
  });

  return mappedCollection;
}

/**
 * Maps a resultSet to a single object.
 * - It is used when your select query is expected to return only one result (e.g. SELECT * FROM table WHERE id = 124).
 * - Although the result is a single object, resultSet may have multiple results (e.g. when the
 *   top-level object has many children in a one-to-many relationship).
 *   So mapOne() must still call map(), only difference is that it will return only the first result.
 *
 * @param {Array} resultSet - an array of database results
 * @param {Array} maps - an array of result maps
 * @param {String} mapId - mapId of the top-level object in the resultSet
 * @param {String} [columnPrefix] - prefix that should be applied to the column names of the top-level object
 * @param {boolean} [isRequired] - is it required to have a mapped object as a return value? Default is true.
 * @returns {Object} one mapped object or null
 * @throws {NotFoundError} if object is not found and isRequired is true
 */
function mapOne(
  resultSet: any[],
  maps: ResultMap[],
  mapId: string,
  columnPrefix?: string,
  isRequired = true,
): any {
  const mappedCollection = map(resultSet, maps, mapId, columnPrefix);

  if (mappedCollection.length > 0) {
    return mappedCollection[0];
  } else if (isRequired) {
    throw new NotFoundError('EmptyResponse');
  } else {
    return null;
  }
}

/**
 * Maps a single database result to a single object using mapId and injects it into mappedCollection.
 *
 * @param {Object} result - a single database result (one row)
 * @param {Array} mappedCollection - the collection in which the mapped object should be injected.
 * @param {Array} maps - an array of result maps
 * @param {String} mapId - mapId of the top-level objects in the resultSet
 * @param {String} [columnPrefix] - prefix that should be applied to the column names of the top-level objects
 */
function injectResultInCollection(
  result,
  mappedCollection,
  maps,
  mapId,
  columnPrefix = '',
) {
  // Check if the object is already in mappedCollection
  const resultMap = maps.find((map) => map.mapId === mapId);
  const idProperty = getIdProperty(resultMap);
  const predicate = idProperty.reduce((accumulator, field) => {
    accumulator[field.name] = result[columnPrefix + field.column];
    return accumulator;
  }, {});

  let mappedObject = mappedCollection.find((item) => {
    for (const k in predicate) {
      if (item[k] !== predicate[k]) {
        return false;
      }
    }
    return true;
  });

  // Inject only if the value of idProperty is not null (ignore joins to null records)
  const isIdPropertyNotNull = idProperty.every(
    (field) => result[columnPrefix + field.column] !== null,
  );

  if (isIdPropertyNotNull) {
    // Create mappedObject if it does not exist in mappedCollection
    if (!mappedObject) {
      mappedObject = createMappedObject(resultMap);
      mappedCollection.push(mappedObject);
    }

    // Inject result in object
    injectResultInObject(result, mappedObject, maps, mapId, columnPrefix);
  }
}

/**
 * Injects id, properties, associations and collections to the supplied mapped object.
 *
 * @param {Object} result - a single database result (one row)
 * @param {Object} mappedObject - the object in which result needs to be injected
 * @param {Array} maps - an array of result maps
 * @param {String} mapId - mapId of the top-level objects in the resultSet
 * @param {String} [columnPrefix] - prefix that should be applied to the column names of the top-level objects
 */
function injectResultInObject(
  result,
  mappedObject,
  maps,
  mapId,
  columnPrefix = '',
) {
  // Get the resultMap for this object
  const resultMap = maps.find((map) => map.mapId === mapId);

  // Copy id property
  const idProperty = getIdProperty(resultMap);

  idProperty.forEach((field) => {
    if (!mappedObject[field.name]) {
      mappedObject[field.name] = result[columnPrefix + field.column];
    }
  });

  const { properties, associations, collections } = resultMap;

  // Copy other properties
  properties &&
    properties.forEach((property) => {
      // If property is a string, convert it to an object
      if (typeof property === 'string') {
        // eslint-disable-next-line
        property = { name: property, column: property };
      }

      // Copy only if property does not exist already
      if (!mappedObject[property.name]) {
        // The default for column name is property name
        const column = property.column ? property.column : property.name;

        mappedObject[property.name] = result[columnPrefix + column];
      }
    });

  // Copy associations
  associations &&
    associations.forEach((association) => {
      let associatedObject = mappedObject[association.name];

      if (!associatedObject) {
        const associatedResultMap = maps.find(
          (map) => map.mapId === association.mapId,
        );
        const associatedObjectIdProperty = getIdProperty(associatedResultMap);

        mappedObject[association.name] = null;

        // Don't create associated object if it's key value is null
        const isAssociatedObjectIdPropertyNotNull =
          associatedObjectIdProperty.every(
            (field) => result[association.columnPrefix + field.column] !== null,
          );

        if (isAssociatedObjectIdPropertyNotNull) {
          associatedObject = createMappedObject(associatedResultMap);
          mappedObject[association.name] = associatedObject;
        }
      }

      if (associatedObject) {
        injectResultInObject(
          result,
          associatedObject,
          maps,
          association.mapId,
          association.columnPrefix,
        );
      }
    });

  // Copy collections
  collections &&
    collections.forEach((collection) => {
      let mappedCollection = mappedObject[collection.name];

      if (!mappedCollection) {
        mappedCollection = [];
        mappedObject[collection.name] = mappedCollection;
      }

      injectResultInCollection(
        result,
        mappedCollection,
        maps,
        collection.mapId,
        collection.columnPrefix,
      );
    });
}

function createMappedObject(resultMap) {
  return resultMap.createNew ? resultMap.createNew() : {};
}

function getIdProperty(resultMap) {
  if (!resultMap.idProperty) {
    return [{ name: 'id', column: 'id' }];
  }

  let idProperties = resultMap.idProperty;

  if (!Array.isArray(idProperties)) {
    idProperties = [idProperties];
  }

  return idProperties.map((idProperty) => {
    // If property is a string, convert it to an object
    if (typeof idProperty === 'string') {
      return { name: idProperty, column: idProperty };
    }

    // The default for column name is property name
    if (!idProperty.column) {
      idProperty.column = idProperty.name;
    }

    return idProperty;
  });
}

export const joinjs = {
  map,
  mapOne,
  NotFoundError,
};
