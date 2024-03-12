export const slugify = (string) => {
  return string.trim().toLowerCase().replace(/\W|_/g, '-');
};

export function articleMap(article) {
  article.author = {
    username: article.username,
    bio: article.bio,
    image: article.image,
    following: Boolean(article.following),
  };
  delete article.username;
  delete article.bio;
  delete article.image;
  delete article.following;
  article.favorited = article.favorited > 0;
  // article.tagList = article.tagList ? article.tagList.split(',') : [];
  article.tagList = article.taglistcsv ? article.taglistcsv.split(',') : [];
  article.tagList.sort();
  delete article.taglistcsv;
  article.updatedAt = new Date(article.updatedAt).toISOString();
  article.createdAt = new Date(article.createdAt).toISOString();
  return article;
}
