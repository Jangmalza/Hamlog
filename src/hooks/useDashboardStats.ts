import { useMemo } from 'react';
import type { Post, PostStatus } from '../data/blogData';
import type { DashboardStats } from '../types/admin';
import type { CategoryTreeResult } from '../utils/categoryTree';
import { DEFAULT_CATEGORY, normalizeDraftCategory } from '../utils/category';
import {
    getScheduledTimestamp,
    isPostVisible,
    normalizePostStatus
} from '../utils/postStatus';

export const useDashboardStats = (posts: Post[], categoryTree: CategoryTreeResult): DashboardStats => {
    return useMemo<DashboardStats>(() => {
        const now = Date.now();
        const statusCount: Record<PostStatus, number> = {
            draft: 0,
            scheduled: 0,
            published: 0
        };
        const tagSet = new Set<string>();
        const seriesSet = new Set<string>();
        const categoryMap = new Map<string, number>();
        const visiblePosts: Post[] = [];
        const scheduledQueue: Array<{ post: Post; timestamp: number }> = [];

        posts.forEach(post => {
            const status = normalizePostStatus(post.status);
            statusCount[status] += 1;
            const category = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
            categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
            post.tags.forEach(tag => tagSet.add(tag));
            if (post.series) seriesSet.add(post.series);
            if (isPostVisible(post, now)) {
                visiblePosts.push(post);
            }
            if (status === 'scheduled') {
                const timestamp = getScheduledTimestamp(post.scheduledAt);
                if (timestamp && timestamp > now) {
                    scheduledQueue.push({ post, timestamp });
                }
            }
        });

        const topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const upcomingScheduled = scheduledQueue
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, 3)
            .map(item => item.post);

        const recentPublished = [...visiblePosts]
            .sort(
                (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            )
            .slice(0, 3);

        return {
            statusCount,
            visibleCount: visiblePosts.length,
            tagsCount: tagSet.size,
            categoriesCount: categoryTree.allNames.length,
            seriesCount: seriesSet.size,
            topCategories,
            upcomingScheduled,
            recentPublished
        };
    }, [posts, categoryTree]);
};
