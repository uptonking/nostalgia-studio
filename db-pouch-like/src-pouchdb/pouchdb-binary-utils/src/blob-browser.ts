/** Abstracts constructing a Blob object, so it also works in older
 * browsers that don't support the native Blob constructor (e.g.
 * old QtWebKit versions, Android < 4.4).
 */
function createBlob(parts, properties) {
  /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e: any) {
    if (e.name !== 'TypeError') {
      throw e;
    }

    const Builder =
      // @ts-expect-error fix-types
      typeof BlobBuilder !== 'undefined'
        ? // @ts-expect-error fix-types
          BlobBuilder
        : // @ts-expect-error fix-types
          typeof MSBlobBuilder !== 'undefined'
          ? // @ts-expect-error fix-types
            MSBlobBuilder
          : // @ts-expect-error fix-types
            typeof MozBlobBuilder !== 'undefined'
            ? // @ts-expect-error fix-types
              MozBlobBuilder
            : // @ts-expect-error fix-types
              WebKitBlobBuilder;

    const builder = new Builder();
    for (let i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

export default createBlob;
