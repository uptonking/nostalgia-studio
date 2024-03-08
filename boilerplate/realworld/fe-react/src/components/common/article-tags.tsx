import * as React from 'react';

import { useArticlesFeed } from '../../hooks/use-articles-provider';

export function ArticleTags({ tagList }: { tagList: string[] }) {
  const { dispatch } = useArticlesFeed();

  // console.log('tagList, ', tagList.toString(), tagList.length);

  if (!tagList || tagList.length === 0) {
    return null;
  }

  return (
    <ul className='tag-list' style={{ maxWidth: '480px' }}>
      {tagList.map((tag, index) => (
        <li
          className='tag-default tag-pill tag-outline'
          style={{ cursor: 'pointer' }}
          key={index}
          onClick={() =>
            dispatch({
              type: 'SET_TAB',
              tab: { type: 'TAG', label: tag },
            })
          }
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

export default ArticleTags;
