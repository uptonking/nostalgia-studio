import * as React from 'react';

import cx from 'clsx';

import type { IProfile } from '../../types';

type FollowUserButtonProps = {
  profile: IProfile;
  onClick: () => void;
  loading: boolean;
};

export function FollowUserButton({
  profile,
  onClick,
  loading,
}: FollowUserButtonProps) {
  return (
    <button
      className={cx(
        'btn',
        'btn-sm',
        'action-btn',
        'mr-sm',
        'article-action-btn',
        {
          'btn-secondary': Boolean(profile.following),
          'btn-outline-secondary': !Boolean(profile.following),
        },
      )}
      onClick={onClick}
      disabled={loading}
    >
      <i className='ion-plus-round' />
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'}
    </button>
  );
}

export default FollowUserButton;
