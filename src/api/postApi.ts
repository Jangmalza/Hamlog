import type { Post, PostInput } from '../data/blogData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface PostListResponse {
  posts: Post[];
  total: number;
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

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch(`${API_BASE_URL}/posts`);
  const data = await handleResponse<PostListResponse>(response);
  return data.posts;
}

export async function createPost(payload: PostInput): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<Post>(response);
}

export async function updatePost(id: string, payload: PostInput): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<Post>(response);
}

export async function deletePost(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok && response.status !== 204) {
    const message = await response.text();
    throw new Error(message || `Failed to delete post (${response.status})`);
  }
}
