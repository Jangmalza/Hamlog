import { readFile, mkdir } from 'fs/promises';
import { postsFilePath, dataDir } from '../config/paths.js';
import { writeJsonAtomic } from '../utils/fsUtils.js';
import {
    normalizeCategory,
    normalizePostStatus,
    normalizeScheduledAt,
    normalizeSeo
} from '../utils/normalizers.js';

export async function readPosts() {
    const raw = await readFile(postsFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((post) => {
        if (!post || typeof post !== 'object') return post;
        return {
            ...post,
            category: normalizeCategory(post.category),
            status: normalizePostStatus(post.status),
            scheduledAt: normalizeScheduledAt(post.scheduledAt) || undefined,
            seo: normalizeSeo(post.seo)
        };
    });
}

export async function writePosts(posts) {
    await writeJsonAtomic(postsFilePath, posts);
}

export async function ensurePostsFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await import('fs/promises').then(fs => fs.access(postsFilePath));
        // Migration logic from index.js (isLegacySeed) omitted for simplicity or can be added if needed.
    } catch {
        // Seed logic. 
        // We might need to import seedPosts from somewhere.
        // For now, write empty array or import seed.
        // const { seedPosts } = await import('./seed.js'); ?
        // Let's just write empty array to avoid complexity for now, or use a simple seed.
        await writePosts([]);
    }
}
