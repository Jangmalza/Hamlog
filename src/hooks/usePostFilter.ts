import { useState, useMemo } from 'react';
import type { Post, PostStatus } from '../data/blogData';
import type { CategoryTreeResult } from '../utils/categoryTree';

interface UsePostFilterProps {
    posts: Post[];
    categoryTree: CategoryTreeResult;
}

export function usePostFilter({ posts }: UsePostFilterProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [page, setPage] = useState(1);

    const filteredPosts = useMemo(() => {
        let result = [...posts].sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        if (filterStatus !== 'all') {
            result = result.filter(post => post.status === filterStatus);
        }

        if (filterCategory !== 'all') {
            result = result.filter(post => post.category === filterCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(post =>
                post.title.toLowerCase().includes(q) ||
                post.slug.toLowerCase().includes(q)
            );
        }

        return result;
    }, [posts, filterStatus, filterCategory, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        page,
        setPage,
        filteredPosts
    };
}
