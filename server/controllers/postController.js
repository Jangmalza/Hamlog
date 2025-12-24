import { randomUUID } from 'crypto';
import { readPosts, writePosts } from '../models/postModel.js';
import { addCategoryIfMissing } from '../models/categoryModel.js';
import { normalizePostData } from '../utils/postHelpers.js';

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
        // 1. Normalize & Validate Input
        const { error, data } = normalizePostData(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        // 2. Check Slug Uniqueness
        const allPosts = await readPosts();
        if (allPosts.some(post => post.slug === data.slug)) {
            return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
        }

        // 3. Side Effects (Category)
        await addCategoryIfMissing(data.category);

        // 4. Create New Post
        const newPost = {
            id: `post-${randomUUID()}`,
            ...data
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

        // 1. Normalize & Validate Input (merging with existing)
        const { error, data } = normalizePostData(req.body, existing);

        if (error) {
            return res.status(400).json({ message: error });
        }

        // 2. Check Slug Uniqueness (if changed)
        if (data.slug !== existing.slug) {
            if (allPosts.some(post => post.slug === data.slug && post.id !== id)) {
                return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
            }
        }

        // 3. Side Effects (Category)
        await addCategoryIfMissing(data.category);

        // 4. Update Post
        const updatedPost = {
            ...existing,
            ...data
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
