import { readFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';
import { postsFilePath, dataDir, postsDir } from '../config/paths.js';
import { writeJsonAtomic } from '../utils/fsUtils.js';
import {
    normalizeCategory,
    normalizePostStatus,
    normalizeScheduledAt,
    normalizeSeo
} from '../utils/normalizers.js';

function normalizePost(post) {
    if (!post || typeof post !== 'object') return post;
    return {
        ...post,
        category: normalizeCategory(post.category),
        status: normalizePostStatus(post.status),
        scheduledAt: normalizeScheduledAt(post.scheduledAt) || undefined,
        seo: normalizeSeo(post.seo)
    };
}

/**
 * Reads all posts. 
 * For performance, we still use posts.json as a primary index/cache,
 * but each write updates both the index and individual files.
 */
export async function readPosts() {
    try {
        const raw = await readFile(postsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizePost);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

/**
 * Writes all posts to the index and individual files.
 */
export async function writePosts(posts) {
    const normalized = posts.map(normalizePost);

    // 1. Update Index
    await writeJsonAtomic(postsFilePath, normalized);

    // 2. Update individual files
    await mkdir(postsDir, { recursive: true });
    for (const post of normalized) {
        const postPath = path.join(postsDir, `${post.slug}.json`);
        await writeJsonAtomic(postPath, post);
    }

    // 3. Cleanup deleted posts individual files
    const files = await readdir(postsDir);
    const existingSlugs = new Set(normalized.map(p => `${p.slug}.json`));
    for (const file of files) {
        if (!existingSlugs.has(file)) {
            await unlink(path.join(postsDir, file)).catch(() => { });
        }
    }
}

export async function ensurePostsFile() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(postsDir, { recursive: true });

    try {
        const raw = await readFile(postsFilePath, 'utf8');
        const posts = JSON.parse(raw);

        if (Array.isArray(posts) && posts.length > 0) {
            const files = await readdir(postsDir);
            if (files.length === 0) {
                console.log(`[Migration] Migrating ${posts.length} posts to individual files...`);
                await writePosts(posts);
                console.log("[Migration] Successfully split posts into individual files.");
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error("[Migration] Error reading posts.json during migration:", error);
        }

        // Rebuild index from individual files if posts.json is missing
        const files = await readdir(postsDir);
        if (files.length > 0) {
            console.log(`[Migration] Index missing. Rebuilding index from ${files.length} files...`);
            const posts = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const raw = await readFile(path.join(postsDir, file), 'utf8');
                        posts.push(JSON.parse(raw));
                    } catch (e) {
                        console.error(`[Migration] Failed to read ${file}:`, e);
                    }
                }
            }
            const normalized = posts.map(normalizePost);
            await writeJsonAtomic(postsFilePath, normalized);
            console.log("[Migration] Index rebuilt successfully.");
        } else {
            await writePosts([]);
        }
    }
}
