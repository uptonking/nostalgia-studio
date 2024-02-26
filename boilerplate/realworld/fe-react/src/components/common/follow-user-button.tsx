import * as React from 'react';

import type { IProfile } from '../../types';

type FollowUserButtonProps = {
  profile: IProfile;
  onClick: () => void;
  loading: boolean;
};

export default function FollowUserButton({
  profile,
  onClick,
  loading,
}: FollowUserButtonProps) {
  const classNames = ['btn', 'btn-sm', 'action-btn'];
  let text = '';

  if (profile.following) {
    classNames.push('btn-secondary');
    text += `Unfollow ${profile.username}`;
  } else {
    classNames.push('btn-outline-secondary');
    text += `Follow ${profile.username}`;
  }

  return (
    <button
      style={{ height: '28px' }}
      className={classNames.join(' ')}
      onClick={onClick}
      disabled={loading}
    >
      <i className='ion-plus-round' />
      &nbsp;
      {text}
    </button>
  );
}
