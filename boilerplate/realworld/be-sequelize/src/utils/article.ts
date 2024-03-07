export const slugify = (string) => {
  return string.trim().toLowerCase().replace(/\W|_/g, '-');
};

export const convertToTagList = (articleTags: any[], article?) => {
  const tagList = articleTags.map((tag) => tag.name);
  if (!article) return tagList;
  article.dataValues.tagList = tagList;
  return tagList;
};
