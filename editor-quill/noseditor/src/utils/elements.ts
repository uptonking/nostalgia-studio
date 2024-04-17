import Delta from 'quill-delta';

export const lineBreakMatcher = () => {
  const newDelta = new Delta();
  newDelta.insert({ break: '' });
  return newDelta;
};
