import * as React from 'react';

import { Link } from 'react-router-dom';

import type { IArticle } from '../../types';
import { getDateISOStrWithTimezone } from '../../utils/common';
import { ALT_IMAGE_URL } from '../../utils/constants';

type ArticleAvatarProps = {
  article: IArticle;
};

const defaultProps = {
  article: {
    slug: 'how-to-train-your-dragon',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'It takes a Jacobian',
    tagList: ['dragons', 'training'],
    createdAt: new Date('2016-02-18T03:22:56.637Z'),
    updatedAt: new Date('2016-02-18T03:48:35.824Z'),
    favorited: false,
    favoritesCount: 0,
    author: {
      username: 'jake',
      bio: 'I work at statefarm',
      image: 'https://i.pravatar.cc/300',
      following: false,
    },
  },
};

export function AuthorAvatar(props: ArticleAvatarProps = defaultProps) {
  const {
    article: { author, createdAt },
  } = props;

  // console.log('==aAvater, ', props);

  if (!author) {
    return null;
  }

  return (
    <React.Fragment>
      <Link to={`/${author.username}`}>
        <img src={author.image || ALT_IMAGE_URL} alt={author.username} />
      </Link>

      <div className='info'>
        <Link className='author' to={`/${author.username}`}>
          {author.username}
        </Link>
        {/* <span className='date'>{new Date(createdAt).toDateString()}</span> */}
        <span className='date'>
          {getDateISOStrWithTimezone(new Date(createdAt).getTime())
            .slice(0, 16)
            .replace('T', ' ')}
        </span>
      </div>
    </React.Fragment>
  );
}

export default AuthorAvatar;
