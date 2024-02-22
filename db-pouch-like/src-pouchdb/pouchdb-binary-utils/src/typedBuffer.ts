/** create a buffer with type */
function typedBuffer(binString, buffType: 'binary' | 'base64', type) {
  // buffType is either 'binary' or 'base64'
  const buff = Buffer.from(binString, buffType);

  // non-standard, but used for consistency with the browser
  // @ts-expect-error fix-types
  buff.type = type;
  return buff;
}

export default typedBuffer;
