import { randomUUID } from 'crypto';
import { readPosts, writePosts } from '../models/postModel.js';
import { createCategory } from './categoryService.js';
import { normalizePostData } from '../utils/postHelpers.js';

export async function getAllPostsService() {
    const posts = await readPosts();
    return { success: true, data: posts };
}

export async function createPostService(rawData) {
    // 1. Normalize & Validate Input
    const { error, data } = normalizePostData(rawData);

    if (error) {
        return { success: false, error, code: 'validation_error' };
    }

    // 2. Check Slug Uniqueness
    const allPosts = await readPosts();
    if (allPosts.some(post => post.slug === data.slug)) {
        return { success: false, error: '슬러그가 이미 존재합니다.', code: 'duplicate_slug' };
    }

    // 3. Side Effects (Category)
    // Ensure category exists using the Service
    await createCategory(data.category);

    // 4. Create New Post
    const newPost = {
        id: `post-${randomUUID()}`,
        ...data
    };

    const next = [newPost, ...allPosts];
    await writePosts(next);

    return { success: true, data: newPost };
}

export async function updatePostService(id, rawData) {
    const allPosts = await readPosts();
    const index = allPosts.findIndex(post => post.id === id);

    if (index === -1) {
        return { success: false, error: '포스트를 찾을 수 없습니다.', code: 'not_found' };
    }

    const existing = allPosts[index];

    // 1. Normalize & Validate Input (merging with existing)
    const { error, data } = normalizePostData(rawData, existing);

    if (error) {
        return { success: false, error, code: 'validation_error' };
    }

    // 2. Check Slug Uniqueness (if changed)
    if (data.slug !== existing.slug) {
        if (allPosts.some(post => post.slug === data.slug && post.id !== id)) {
            return { success: false, error: '슬러그가 이미 존재합니다.', code: 'duplicate_slug' };
        }
    }

    // 3. Side Effects (Category)
    await createCategory(data.category);

    // 4. Update Post
    const updatedPost = {
        ...existing,
        ...data
    };

    allPosts[index] = updatedPost;
    await writePosts(allPosts);

    return { success: true, data: updatedPost };
}

export async function deletePostService(id) {
    const allPosts = await readPosts();
    const next = allPosts.filter(post => post.id !== id);

    if (next.length === allPosts.length) {
        return { success: false, error: '포스트를 찾을 수 없습니다.', code: 'not_found' };
    }

    await writePosts(next);
    return { success: true };
}
