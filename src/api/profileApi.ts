import type { SiteMeta } from '../data/blogData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ProfileResponse {
  profile: SiteMeta;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || `Request failed with status ${response.status}`);
    }
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProfile(): Promise<SiteMeta> {
  const response = await fetch(`${API_BASE_URL}/profile`);
  const data = await handleResponse<ProfileResponse>(response);
  return data.profile;
}

export async function updateProfile(profile: SiteMeta): Promise<SiteMeta> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profile)
  });
  const data = await handleResponse<ProfileResponse>(response);
  return data.profile;
}
