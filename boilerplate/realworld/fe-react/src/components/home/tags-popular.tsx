import React, { useEffect, useMemo, useState } from 'react';

import { getTags } from '../../api/tags-api';
import { useArticlesFeed } from '../../hooks/use-articles-provider';

export function TagsPopular() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useArticlesFeed();

  // console.log('==Tags-render');

  useEffect(() => {
    let ignore = false;
    // console.log('==Tags-useEffect');

    async function fetchTags() {
      // console.log('==Tags-fetchTags');

      setLoading(true);
      try {
        const payload = await getTags();
        if (!ignore) {
          setTags((payload as any).data.tags);
        }
      } catch (error) {
        // console.log(error);
      }
      if (!ignore) {
        setLoading(false);
      }
    }

    fetchTags();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className='col-md-3'>
      <div className='sidebar'>
        <p>Popular Tags</p>
        {loading ? (
          <div>Loading Tags...</div>
        ) : (
          <div className='tag-list'>
            {tags.map((tag) => (
              <button
                key={tag}
                className='tag-pill tag-default tag-outline'
                onClick={() =>
                  dispatch({
                    type: 'SET_TAB',
                    tab: { type: 'TAG', label: tag },
                  })
                }
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagsPopular;
