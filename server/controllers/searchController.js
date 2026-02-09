import { readPosts } from '../models/postModel.js';

export const searchPosts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }

        const query = q.toLowerCase();
        const posts = await readPosts();

        // Filter published posts and search in all relevant fields
        const results = posts.filter(post => {
            if (post.status !== 'published') return false;

            const inTitle = post.title?.toLowerCase().includes(query);
            const inSummary = post.summary?.toLowerCase().includes(query);
            const inSlug = post.slug?.toLowerCase().includes(query);
            const inCategory = post.category?.toLowerCase().includes(query);
            const inTags = post.tags?.some(tag => tag.toLowerCase().includes(query));
            // Full content search
            const inContent = post.contentHtml?.toLowerCase().includes(query);

            return inTitle || inSummary || inSlug || inCategory || inTags || inContent;
        });

        // Sort by date (newest first)
        results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }
};
