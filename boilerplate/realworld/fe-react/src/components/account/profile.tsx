import React, { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import {
  followProfile,
  getProfile,
  unfollowProfile,
} from '../../api/profile-api';
import { ArticlesFeedProvider } from '../../hooks/use-articles-provider';
import { useAuth } from '../../hooks/use-auth-provider';
import type { ProfileType } from '../../types';
import { AVATAR_IMAGE_FALLBACK } from '../../utils/constants';
import { FollowUserButton } from '../common/follow-user-button';
import { ProfileArticles } from './profile-articles';

export function Profile() {
  const { username } = useParams();
  // console.log(';; Profile-username, ', username);
  const {
    state: { user },
  } = useAuth();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchProfile() {
      try {
        const payload = await getProfile(username);
        // console.log('==profile-payload, ', JSON.stringify(payload));
        if (!ignore) {
          setProfile((payload as any).data.profile);
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchProfile();
    return () => {
      ignore = true;
    };
  }, [username]);

  const handleClick = async () => {
    if (!profile) return;
    let payload;
    setIsLoading(true);
    try {
      if (profile.following) {
        payload = await unfollowProfile(profile.username);
      } else {
        payload = await followProfile(profile.username);
      }
      setProfile(payload.data.profile);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const isMyself = profile && user && profile.username === user.username;

  if (!profile) return null;

  return (
    <div className='profile-page'>
      <div className='user-info'>
        <div className='container'>
          <div className='row'>
            <div className='col-xs-12 col-md-10 offset-md-1'>
              <img
                src={profile.image || AVATAR_IMAGE_FALLBACK}
                className='user-img'
                alt={profile.username}
              />
              <h4>{profile.username}</h4>
              <p>{profile.bio}</p>
              {isMyself ? (
                <Link
                  to='/settings'
                  className='btn btn-sm btn-outline-secondary action-btn'
                >
                  <i className='ion-gear-a' /> Edit Profile
                </Link>
              ) : (
                <FollowUserButton
                  profile={profile}
                  onClick={handleClick}
                  loading={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <ArticlesFeedProvider>
        <ProfileArticles username={username} />
      </ArticlesFeedProvider>
    </div>
  );
}

export default Profile;
