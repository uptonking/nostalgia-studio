import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import {
  type ArticleListAction,
  type ArticleListState,
  articlesReducer,
  initialState,
} from '../reducers/articles-materials';

type ArticleListContextProps = {
  state: ArticleListState;
  dispatch: React.Dispatch<ArticleListAction>;
};

const ArticlesContext = createContext<ArticleListContextProps>({
  state: initialState,
  dispatch: () => initialState,
});

export function ArticlesFeedProvider(props: React.PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(articlesReducer, initialState);

  const articlesFeedData = useMemo(() => ({ state, dispatch }), [state]);

  return <ArticlesContext.Provider {...props} value={articlesFeedData} />;
}

export function useArticlesFeed() {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error(
      `useArticlesFeed must be used within an ArticlesFeedProvider`,
    );
  }
  return context;
}
