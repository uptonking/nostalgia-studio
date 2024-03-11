import { db } from '../db/connection';
import { joinjs } from '../db/joinjs';
import { getSelect } from '../db/knex-query';
import {
  articleFields,
  relationsMaps,
  userFields,
} from '../db/models-relations';
import { omit } from '../utils/common';
import { userRepo } from './user-repository';

export const findAndCountAll = async (options: any) => {
  const { author, tag, favorited, limit = 5, offset = 0 } = options;

  let articlesQuery = db('articles')
    .select(
      ...getSelect('articles', 'article', articleFields),
      ...getSelect('users', 'author', userFields),
      ...getSelect('articles_tags', 'tag', ['id']),
      ...getSelect('tags', 'tag', ['id', 'name']),
      'favorites.id as article_favorited',
      'followers.id as author_following',
    )
    .limit(limit)
    .offset(offset)
    .orderBy('articles.created_at', 'desc');

  const countQuery = db('articles').count();

  if (author && author.length > 0) {
    // const subQuery = db("users")
    //   .select("id")
    //   .whereIn("username", author)
    // articlesQuery = articlesQuery.andWhere("articles.author", "in", subQuery)
    // countQuery = countQuery.andWhere("articles.author", "in", subQuery)
  }

  if (favorited && favorited.length > 0) {
    // const subQuery = db("favorites")
    //   .select("article")
    //   .whereIn(
    //     "user",
    //     db("users")
    //       .select("id")
    //       .whereIn("username", favorited),
    //   )
    // articlesQuery = articlesQuery.andWhere("articles.id", "in", subQuery)
    // countQuery = countQuery.andWhere("articles.id", "in", subQuery)
  }

  if (tag && tag.length > 0) {
    // const subQuery = db("articles_tags")
    //   .select("article")
    //   .whereIn(
    //     "tag",
    //     db("tags")
    //       .select("id")
    //       .whereIn("name", tag),
    //   )
    // articlesQuery = articlesQuery.andWhere("articles.id", "in", subQuery)
    // countQuery = countQuery.andWhere("articles.id", "in", subQuery)
  }

  articlesQuery = articlesQuery
    .leftJoin('users', 'articles.author', 'users.id')
    .leftJoin('articles_tags', 'articles.id', 'articles_tags.article')
    .leftJoin('tags', 'articles_tags.tag', 'tags.id');
  // .leftJoin("favorites", () => {
  //   this.on("articles.id", "=", "favorites.article").onIn(
  //     "favorites.user",
  //     [user && user.id],
  //   )
  // })
  // .leftJoin("followers", () => {
  //   this.on(
  //     "articles.author",
  //     "=",
  //     "followers.user",
  //   ).onIn("followers.follower", [user && user.id])
  // })

  let [articles, [countRes]] = await Promise.all([articlesQuery, countQuery]);

  articles = joinjs
    .map(articles, relationsMaps, 'articleMap', 'article_')
    .map((a) => {
      a.favorited = Boolean(a.favorited);
      a.tagList = a.tagList.map((t) => t.name);
      a.author.following = Boolean(a.author.following);
      delete a.author.id;
      return a;
    });

  const articlesCount = Number(countRes.count || countRes['count(*)']);

  return { articles, articlesCount };
};

export const findOneBySlug = async (slug) => {
  const article = await db('articles').first().where({ slug });

  // const tagsRelations = await db("articles_tags")
  // .select()
  // .where({ article: article.id })

  // article.tagList = tagList
  // article.favorited = false

  const author = await userRepo.findOneByIdOrEmail(article.author);

  article.author = author;
  article.author.following = false;

  return article;
};

export const createOne = async (article) => {
  return await db('articles')
    .returning('*')
    .insert(omit(article, ['tagList']));
};

export const articleRepo = {
  findAndCountAll,
  createOne,
  findOneBySlug,
};
