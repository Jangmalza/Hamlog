import { normalizePostStatus, normalizeScheduledAt } from './normalizers.js';

export function getScheduledTimestamp(value) {
    const normalized = normalizeScheduledAt(value);
    if (!normalized) return null;

    const timestamp = new Date(normalized).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

export function isPostPublicVisible(post, now = Date.now()) {
    const status = normalizePostStatus(post?.status);
    if (status === 'draft') return false;
    if (status === 'scheduled') {
        const scheduledAt = getScheduledTimestamp(post?.scheduledAt);
        return scheduledAt !== null && scheduledAt <= now;
    }
    return true;
}

export function filterPublicPosts(posts, now = Date.now()) {
    return posts.filter(post => isPostPublicVisible(post, now));
}

export function findPublicPostBySlug(posts, slug, now = Date.now()) {
    return posts.find(post => post.slug === slug && isPostPublicVisible(post, now));
}
