import * as React from 'react';

import { Flex, Grid, View } from '@adobe/react-spectrum';
import { articleReducer, initialState } from '../../reducers/article';
import { useEffect, useReducer, useState } from 'react';

import ArticleMeta from './article-meta';
import ArticleTags from '../common/article-tags';
import CommentContainer from './comment-container';
import { getArticle } from '../../api/article-api';
import { getArticleComments } from '../../api/comments-api';
import marked from 'marked';
import { useParams } from 'react-router-dom';

export function Article() {
  const { slug } = useParams();
  const [{ article, comments, loading, error }, dispatch] = useReducer(
    articleReducer,
    initialState,
  );

  useEffect(() => {
    dispatch({ type: 'FETCH_ARTICLE_BEGIN' });
    let ignore = false;

    const fetchArticle = async () => {
      try {
        const [articlePayload, commentsPayload] = await Promise.all([
          getArticle(slug),
          getArticleComments(slug),
        ]);

        // console.log('==articlePayload, ', articlePayload.data);
        if (!ignore) {
          dispatch({
            type: 'FETCH_ARTICLE_SUCCESS',
            payload: {
              article: (articlePayload as any).data.article,
              comments: (commentsPayload as any).data.comments,
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

  const convertToMarkdown = (text: string) => ({
    // __html: marked(text, { sanitize: true }),
    __html: marked(text),
  });

  console.log('==cur-article, ', article);
  return (
    article && (
      <View>
        <View
          paddingY='size-160'
          backgroundColor='gray-900'
          UNSAFE_style={{ color: '#fff' }}
        >
          <Grid
            rowGap='size-200'
            marginX='size-2400'
            marginY='size-400'
            backgroundColor='blue-600'
          >
            <h1>{article.title}</h1>
            <ArticleMeta article={article} dispatch={dispatch} />
          </Grid>
        </View>

        <View marginX='size-2400' marginY='size-400'>
          <div className=''>
            <p dangerouslySetInnerHTML={convertToMarkdown(article.body)} />
            <ArticleTags tagList={article.tagList} />
            <hr style={{ color: '#333' }} />
          </div>

          <Grid justifyContent='center' rowGap='size-400' marginTop='size-400'>
            <ArticleMeta article={article} dispatch={dispatch} />

            <CommentContainer
              comments={comments}
              slug={slug}
              dispatch={dispatch}
            />
          </Grid>
        </View>
      </View>
    )
  );
}

export default Article;
