import * as React from 'react';

import cx from 'clsx';

import type { ProfileType } from '../../types';

type FollowUserButtonProps = {
  profile: ProfileType;
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
      className={cx('btn', 'btn-sm', 'action-btn', 'mr-sm', {
        'btn-secondary': Boolean(profile?.following),
        'btn-outline-secondary': !Boolean(profile?.following),
      })}
      onClick={onClick}
      disabled={loading}
    >
      <i className='ion-plus-round' />
      {profile?.following ? 'Unfollow' : 'Follow'}
    </button>
  );
}

export default FollowUserButton;
