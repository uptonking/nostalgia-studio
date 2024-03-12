import { db } from '../db/connection';
import { joinjs } from '../db/joinjs';
import { getSelect } from '../db/knex-query';
import {
  articleFields,
  relationsMaps,
  userFields,
} from '../db/models-relations';
import { articleMap } from '../utils/article';
import { omit } from '../utils/common';
import { usersRepo } from './users-repository';

export const findAndCountAll = async (options: any) => {
  const { author, tag, favorited, limit = 5, offset = 0 } = options;
  const userId = '';

  const query = db('articles')
    .join('users', 'articles.author', 'users.id')
    // .leftJoin('favorites', 'articles.id', 'favorites.article')
    // .leftJoin('favorites as favorites2', function () {
    //   this.on('favorites2.article', '=', 'articles.id').andOn(
    //     'favorites2.user',
    //     '=',
    //     userId,
    //   );
    // })
    // .leftJoin('followers', function () {
    //   this.on('followers.user', '=', 'users.id').andOn(
    //     'followers.follower',
    //     '=',
    //     userId,
    //   );
    // })
    .leftJoin('articles_tags', 'articles.id', 'articles_tags.article')
    .leftJoin('tags', 'articles_tags.tag', 'tags.id');
  // .orderBy('articles.created_at', 'desc');

  if (tag) {
    query
      .join(
        'articles_tags as articles_tags_tag',
        'articles.id',
        'articles_tags_tag.article',
      )
      .join('tags as tags_tag', 'articles_tags_tag.tag', 'tags_tag.id')
      .where('tags_tag.name', tag);
  }

  if (author) {
    query.where('users.username', author);
  }

  if (favorited) {
    query
      .join(
        'favorites as favorites_fav',
        'articles.id',
        'favorites_fav.article',
      )
      .join('users as users_fav', 'favorites_fav.user', 'users_fav.id')
      .where('users_fav.username', favorited);
  }

  const totalCount = await query.clone().count('*', { as: 'count' }).first();

  // console.log(';; totalCount ', totalCount);

  if (typeof totalCount === 'undefined') {
    return { articles: [], articlesCount: 0 };
  }

  query
    .select(
      'articles.id',
      'articles.slug',
      'articles.title',
      'articles.description',
      'articles.body',
      'articles.created_at as createdAt',
      'articles.updated_at as updatedAt',
    )
    .select('users.username', 'users.bio', 'users.image')
    // .select(db.raw('group_concat(distinct tags.name) as tagList'))
    .select(db.raw("string_agg(distinct tags.name, ',') as tagListCsv"))
    .groupBy('articles.id')
    .groupBy('users.username')
    .groupBy('users.bio')
    .groupBy('users.image')
    .orderBy('articles.created_at', 'desc')
    // .countDistinct('favorites.id as favoritesCount')
    // .count('favorites2.id as favorited')
    // .count('followers.id as following')
    .offset(offset)
    .limit(limit);

  const articles = await query;
  // console.log(';; articlesAll ', articles);

  articles.map(articleMap);

  return { articles, articlesCount: (totalCount.count as number) || 0 };
};

export const findAndCountAll1 = async (options: any) => {
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
  const userId = '';
  const query = db('articles')
    .leftJoin('users', 'articles.author', 'users.id')
    // .leftJoin('favorites', 'articles.id', 'favorites.article')
    // .leftJoin('favorites as favorites2', function () {
    //   this.on('favorites2.article', '=', 'articles.id').andOn(
    //     'favorites2.user',
    //     '=',
    //     userId,
    //   );
    // })
    // .leftJoin('followers', function () {
    //   this.on('followers.user', '=', 'users.id').andOn(
    //     'followers.follower',
    //     '=',
    //     userId,
    //   );
    // })
    .leftJoin('articles_tags', 'articles.id', 'articles_tags.article')
    .leftJoin('tags', 'articles_tags.tag', 'tags.id')
    .where('articles.slug', slug)
    .orderBy('articles.created_at', 'desc');

  query
    .select(
      'articles.id',
      'articles.slug',
      'articles.title',
      'articles.description',
      'articles.body',
      'articles.created_at as createdAt',
      'articles.updated_at as updatedAt',
    )
    .select('users.username', 'users.bio', 'users.image')
    .select(db.raw("string_agg(distinct tags.name, ',') as tagListCsv"))
    .groupBy('articles.id')
    .groupBy('articles.id')
    .groupBy('users.username')
    .groupBy('users.bio')
    .groupBy('users.image');
  // .select(db.raw('group_concat(distinct tags.name) as tagList'))
  // .countDistinct('favorites.id as favoritesCount')
  // .count('favorites2.id as favorited')
  // .count('followers.id as following')

  const articles = await query;

  // console.log(';; blogSlug ', articles);
  articles.map(articleMap);

  return articles[0] || null;
};

export const findOneBySlug1 = async (slug) => {
  const article = await db('articles').first().where({ slug });

  // const tagsRelations = await db("articles_tags")
  // .select()
  // .where({ article: article.id })

  // article.tagList = tagList
  // article.favorited = false

  const author = await usersRepo.findByIdOrEmailOrUsername(article.author);

  article.author = author;
  article.author.following = false;

  return article;
};

/** create article without tags */
export const insertOne = async (article) => {
  const _article = await db('articles')
    .returning('*')
    .insert(omit(article, ['tagList']));
  return _article[0];
};

export const articlesRepo = {
  findAndCountAll,
  findOneBySlug,
  insertOne,
};
