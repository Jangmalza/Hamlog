import type { Post, PostInput } from '../data/blogData';
import { requestJson, requestVoid } from './client';

interface PostListResponse {
  posts: Post[];
  total: number;
}

export async function fetchPosts(): Promise<Post[]> {
  const data = await requestJson<PostListResponse>('/posts');
  return data.posts;
}

export async function createPost(payload: PostInput): Promise<Post> {
  return requestJson<Post>('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function updatePost(id: string, payload: PostInput): Promise<Post> {
  return requestJson<Post>(`/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function deletePost(id: string): Promise<void> {
  await requestVoid(`/posts/${id}`, { method: 'DELETE' });
}
