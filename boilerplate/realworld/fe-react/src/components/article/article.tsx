import React, { useEffect, useReducer, useState } from 'react';

import { marked } from 'marked';
import { useParams } from 'react-router-dom';

import { getArticle } from '../../api/article-api';
import { getArticleComments } from '../../api/comments-api';
import { articleReducer, initialState } from '../../reducers/article';
import { ArticleTags } from '../common/article-tags';
import { ArticleMeta } from './article-meta';
import { CommentContainer } from './comment-container';

function convertToMarkdown(mdText: string) {
  return {
    __html: marked.parse(mdText),
  };
}

export function Article() {
  const { slug } = useParams();
  const [{ article, comments, loading, error }, dispatch] = useReducer(
    articleReducer,
    initialState,
  );

  useEffect(() => {
    dispatch({ type: 'FETCH_ARTICLE_START' });
    let ignore = false;

    const fetchArticle = async () => {
      try {
        // const [articlePayload, commentsPayload] = await Promise.all([
        const [articlePayload] = await Promise.all([
          getArticle(slug),
          // getArticleComments(slug),
        ]);

        // console.log('==articlePayload, ', articlePayload.data);
        if (!ignore) {
          dispatch({
            type: 'FETCH_ARTICLE_SUCCESS',
            payload: {
              article: (articlePayload as any).data.article,
              comments: [],
              // comments: (commentsPayload as any)?.data?.comments,
            },
          });
        }
      } catch (error) {
        console.log(error);
        dispatch({
          type: 'FETCH_ARTICLE_ERROR',
          error,
        });
      }
    };

    fetchArticle();
    return () => {
      ignore = true;
    };
  }, [dispatch, slug]);

  // console.log('==cur-article, ', article);

  if (!article) return null;

  return (
    <div className='article-page'>
      <div className='banner'>
        <div className='container'>
          <div className='article-title'>
            <h1>{article.title}</h1>
          </div>
          <ArticleMeta
            article={article}
            dispatch={dispatch}
            className='flex-center-h'
          />
        </div>
      </div>

      <div className='container page'>
        <div className='row article-content'>
          <div className='col-md-12'>
            <p dangerouslySetInnerHTML={convertToMarkdown(article.body)} />
            <ArticleTags tagList={article.tagList} />
          </div>
        </div>

        {/* <hr /> */}

        {/* <div className='article-actions'>
          <ArticleMeta article={article} dispatch={dispatch} />
        </div> */}

        {/* <CommentContainer comments={comments} slug={slug} dispatch={dispatch} /> */}
      </div>
    </div>
  );
}

export default Article;
