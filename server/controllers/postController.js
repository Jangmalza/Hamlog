import { randomUUID } from 'crypto';
import { readPosts, writePosts } from '../models/postModel.js';
import { addCategoryIfMissing } from '../models/categoryModel.js';
import {
    normalizeCategory,
    normalizePostStatus,
    normalizeScheduledAt,
    normalizeSeo,
    normalizeTags,
    normalizeSections,
    normalizeContentHtml,
    normalizeContentHtml as normalizeHtml // alias if needed
} from '../utils/normalizers.js';

export const getPosts = async (req, res) => {
    try {
        const posts = await readPosts();
        res.json({ posts, total: posts.length });
    } catch (error) {
        console.error('Failed to fetch posts', error);
        res.status(500).json({ message: '포스트를 불러오지 못했습니다.' });
    }
};

export const createPost = async (req, res) => {
    try {
        const {
            slug,
            title,
            summary,
            contentHtml,
            category,
            status,
            scheduledAt,
            seo,
            publishedAt,
            readingTime,
            tags,
            series,
            featured,
            cover,
            sections
        } = req.body ?? {};

        const normalizedSlug = slug ? String(slug).trim() : '';
        const normalizedTitle = title ? String(title).trim() : '';

        if (!normalizedSlug || !normalizedTitle) {
            return res.status(400).json({ message: '슬러그와 제목이 필요합니다.' });
        }

        const normalizedSections = normalizeSections(sections);
        const normalizedContentHtml = normalizeContentHtml(contentHtml);
        const normalizedStatus = normalizePostStatus(status);
        if (
            normalizedStatus !== 'draft' &&
            normalizedSections.length === 0 &&
            !normalizedContentHtml
        ) {
            return res.status(400).json({ message: '본문 내용이 필요합니다.' });
        }

        const allPosts = await readPosts();
        if (allPosts.some(post => post.slug === normalizedSlug)) {
            return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
        }

        const normalizedTags = normalizeTags(tags);
        const normalizedSeries = series ? String(series).trim() : '';
        const normalizedCover = cover ? String(cover).trim() : '';
        const normalizedReadingTime = readingTime ? String(readingTime).trim() : '';
        const normalizedCategory = normalizeCategory(category);
        const normalizedScheduledAt = normalizeScheduledAt(scheduledAt);
        if (normalizedStatus === 'scheduled' && !normalizedScheduledAt) {
            return res.status(400).json({ message: '예약 발행 날짜가 필요합니다.' });
        }
        const normalizedSeo = normalizeSeo(seo);

        // Side effect: update categories
        await addCategoryIfMissing(normalizedCategory);

        const normalizedPublishedAt = publishedAt
            ? String(publishedAt)
            : new Date().toISOString().slice(0, 10);
        const effectivePublishedAt =
            normalizedStatus === 'scheduled' && normalizedScheduledAt
                ? normalizedScheduledAt.slice(0, 10)
                : normalizedPublishedAt;

        const newPost = {
            id: `post-${randomUUID()}`,
            slug: normalizedSlug,
            title: normalizedTitle,
            summary: summary ? String(summary).trim() : '요약이 없습니다.',
            category: normalizedCategory,
            contentHtml: normalizedContentHtml || undefined,
            publishedAt: effectivePublishedAt,
            readingTime: normalizedReadingTime || '3분 읽기',
            tags: normalizedTags,
            series: normalizedSeries || undefined,
            featured: Boolean(featured),
            cover: normalizedCover || undefined,
            status: normalizedStatus,
            scheduledAt: normalizedScheduledAt || undefined,
            seo: normalizedSeo,
            sections: normalizedSections
        };

        const next = [newPost, ...allPosts];
        await writePosts(next);

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Failed to create post', error);
        res.status(500).json({ message: '포스트 생성에 실패했습니다.' });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const allPosts = await readPosts();
        const index = allPosts.findIndex(post => post.id === id);

        if (index === -1) {
            return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }

        const existing = allPosts[index];
        const {
            slug,
            title,
            summary,
            contentHtml,
            category,
            status,
            scheduledAt,
            seo,
            publishedAt,
            readingTime,
            tags,
            series,
            featured,
            cover,
            sections
        } = req.body ?? {};

        const normalizedSlug = slug ? String(slug).trim() : existing.slug;
        const normalizedTitle = title ? String(title).trim() : existing.title;

        if (!normalizedSlug || !normalizedTitle) {
            return res.status(400).json({ message: '슬러그와 제목이 필요합니다.' });
        }

        if (allPosts.some(post => post.slug === normalizedSlug && post.id !== id)) {
            return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
        }

        const normalizedSections =
            sections !== undefined ? normalizeSections(sections) : existing.sections ?? [];
        const normalizedContentHtml =
            contentHtml !== undefined
                ? normalizeContentHtml(contentHtml)
                : normalizeContentHtml(existing.contentHtml);
        const normalizedStatus =
            status !== undefined
                ? normalizePostStatus(status)
                : normalizePostStatus(existing.status);
        if (
            normalizedStatus !== 'draft' &&
            normalizedSections.length === 0 &&
            !normalizedContentHtml
        ) {
            return res.status(400).json({ message: '본문 내용이 필요합니다.' });
        }

        const normalizedSeries = series !== undefined ? String(series).trim() : '';
        const normalizedCover = cover !== undefined ? String(cover).trim() : '';
        const normalizedReadingTime = readingTime ? String(readingTime).trim() : '';
        const normalizedCategory =
            category !== undefined ? normalizeCategory(category) : normalizeCategory(existing.category);
        const normalizedScheduledAt =
            scheduledAt !== undefined
                ? normalizeScheduledAt(scheduledAt)
                : normalizeScheduledAt(existing.scheduledAt);
        if (normalizedStatus === 'scheduled' && !normalizedScheduledAt) {
            return res.status(400).json({ message: '예약 발행 날짜가 필요합니다.' });
        }
        const normalizedSeo = seo !== undefined ? normalizeSeo(seo) : normalizeSeo(existing.seo);

        await addCategoryIfMissing(normalizedCategory);

        const normalizedPublishedAt =
            publishedAt !== undefined ? String(publishedAt) : existing.publishedAt;
        const effectivePublishedAt =
            normalizedStatus === 'scheduled' && normalizedScheduledAt
                ? normalizedScheduledAt.slice(0, 10)
                : normalizedPublishedAt;

        const updated = {
            ...existing,
            ...Object.fromEntries(Object.entries({
                slug: normalizedSlug,
                title: normalizedTitle,
                summary: summary !== undefined ? String(summary).trim() : existing.summary,
                category: normalizedCategory,
                contentHtml: normalizedContentHtml || undefined,
                publishedAt: effectivePublishedAt,
                readingTime: normalizedReadingTime || existing.readingTime,
                tags: tags !== undefined ? normalizeTags(tags) : existing.tags,
                series: series !== undefined ? normalizedSeries || undefined : existing.series,
                featured: featured !== undefined ? Boolean(featured) : existing.featured,
                cover: cover !== undefined ? normalizedCover || undefined : existing.cover,
                status: normalizedStatus,
                scheduledAt: normalizedScheduledAt || undefined,
                seo: normalizedSeo,
                sections: normalizedSections
            }).filter(([_, v]) => v !== undefined)) // Clean up undefineds if any
        };
        // Simplified object spread instead of filter for clarity/correctness vs original:
        // Original code constructed the object explicitly. I will match that closer to avoid bugs.

        const updatedPost = {
            ...existing,
            slug: normalizedSlug,
            title: normalizedTitle,
            summary: summary !== undefined ? String(summary).trim() : existing.summary,
            category: normalizedCategory,
            contentHtml: normalizedContentHtml || undefined,
            publishedAt: effectivePublishedAt,
            readingTime: normalizedReadingTime || existing.readingTime,
            tags: tags !== undefined ? normalizeTags(tags) : existing.tags,
            series: series !== undefined ? normalizedSeries || undefined : existing.series,
            featured: featured !== undefined ? Boolean(featured) : existing.featured,
            cover: cover !== undefined ? normalizedCover || undefined : existing.cover,
            status: normalizedStatus,
            scheduledAt: normalizedScheduledAt || undefined,
            seo: normalizedSeo,
            sections: normalizedSections
        };

        allPosts[index] = updatedPost;
        await writePosts(allPosts);

        res.json(updatedPost);
    } catch (error) {
        console.error('Failed to update post', error);
        res.status(500).json({ message: '포스트 수정에 실패했습니다.' });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const allPosts = await readPosts();
        const next = allPosts.filter(post => post.id !== id);

        if (next.length === allPosts.length) {
            return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }

        await writePosts(next);
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete post', error);
        res.status(500).json({ message: '포스트 삭제에 실패했습니다.' });
    }
};
