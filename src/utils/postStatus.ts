import type { Post, PostStatus } from '../data/blogData';

export const normalizePostStatus = (status?: PostStatus) => status ?? 'published';

export const getScheduledTimestamp = (value?: string) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const isPostVisible = (post: Post, now: number = Date.now()) => {
  const status = normalizePostStatus(post.status);
  if (status === 'draft') return false;
  if (status === 'scheduled') {
    const scheduledAt = getScheduledTimestamp(post.scheduledAt);
    return scheduledAt !== null && scheduledAt <= now;
  }
  return true;
};

export const getPostStatusLabel = (status: PostStatus) => {
  switch (status) {
    case 'draft':
      return '초안';
    case 'scheduled':
      return '예약';
    case 'published':
    default:
      return '발행';
  }
};
