import type { SiteMeta } from '../data/blogData';
import { requestJson } from './client';

interface ProfileResponse {
  profile: SiteMeta;
}

export async function fetchProfile(): Promise<SiteMeta> {
  const data = await requestJson<ProfileResponse>('/profile');
  return data.profile;
}

export async function updateProfile(profile: SiteMeta): Promise<SiteMeta> {
  const data = await requestJson<ProfileResponse>('/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profile)
  });
  return data.profile;
}
