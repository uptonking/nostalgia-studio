import type { IProfile } from '../types';
import API from './api-utils';

type Profile = {
  profile: IProfile;
};

export function followProfile(username: string) {
  return API.post<Profile>(`/profiles/${username}/follow`);
}

export function getProfile(username: string) {
  return API.get<Profile>(`/profiles/${username}`);

  // return mockApi.getUserProfile(username);
}

export function unfollowProfile(username: string) {
  return API.delete<Profile>(`/profiles/${username}/follow`);
}
