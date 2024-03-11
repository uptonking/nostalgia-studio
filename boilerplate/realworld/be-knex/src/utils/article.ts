export const slugify = (string) => {
  return string.trim().toLowerCase().replace(/\W|_/g, '-');
};
