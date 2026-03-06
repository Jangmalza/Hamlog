import { useEffect, useMemo, useState } from 'react';
import type { Post, PostStatus } from '../data/blogData';
import type { CategoryTreeResult } from '../utils/categoryTree';
import { collectCategoryNames } from '../utils/categoryTree';
import { normalizeCategoryKey } from '../utils/category';

interface UsePostFilterProps {
    posts: Post[];
    categoryTree: CategoryTreeResult;
}

export function usePostFilter({ posts, categoryTree }: UsePostFilterProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>(() => {
        if (typeof window === 'undefined') return 'all';
        const saved = window.localStorage.getItem('hamlog:admin:post-filter');
        if (!saved) return 'all';
        try {
            const parsed = JSON.parse(saved) as { status?: PostStatus | 'all' };
            return parsed.status ?? 'all';
        } catch {
            return 'all';
        }
    });
    const [filterCategory, setFilterCategory] = useState<string>(() => {
        if (typeof window === 'undefined') return 'all';
        const saved = window.localStorage.getItem('hamlog:admin:post-filter');
        if (!saved) return 'all';
        try {
            const parsed = JSON.parse(saved) as { category?: string };
            return parsed.category ?? 'all';
        } catch {
            return 'all';
        }
    });
    const [filterCategoryIncludeDescendants, setFilterCategoryIncludeDescendants] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = window.localStorage.getItem('hamlog:admin:post-filter');
        if (!saved) return true;
        try {
            const parsed = JSON.parse(saved) as { includeDescendants?: boolean };
            return parsed.includeDescendants ?? true;
        } catch {
            return true;
        }
    });
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(
            'hamlog:admin:post-filter',
            JSON.stringify({
                status: filterStatus,
                category: filterCategory,
                includeDescendants: filterCategoryIncludeDescendants
            })
        );
    }, [filterCategory, filterCategoryIncludeDescendants, filterStatus]);

    const matchingCategoryKeys = useMemo(() => {
        if (filterCategory === 'all') return null;

        const selectedNode = categoryTree.nodesByKey.get(normalizeCategoryKey(filterCategory));
        if (!selectedNode) {
            return new Set([normalizeCategoryKey(filterCategory)]);
        }

        if (!filterCategoryIncludeDescendants) {
            return new Set([normalizeCategoryKey(selectedNode.name)]);
        }

        return new Set(
            collectCategoryNames(selectedNode).map(categoryName => normalizeCategoryKey(categoryName))
        );
    }, [categoryTree, filterCategory, filterCategoryIncludeDescendants]);

    const filteredPosts = useMemo(() => {
        let result = [...posts].sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        if (filterStatus !== 'all') {
            result = result.filter(post => post.status === filterStatus);
        }

        if (filterCategory !== 'all') {
            result = result.filter(post =>
                matchingCategoryKeys?.has(normalizeCategoryKey(post.category ?? ''))
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(post =>
                post.title.toLowerCase().includes(q) ||
                post.slug.toLowerCase().includes(q)
            );
        }

        return result;
    }, [posts, filterStatus, filterCategory, matchingCategoryKeys, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        filterCategoryIncludeDescendants,
        setFilterCategoryIncludeDescendants,
        page,
        setPage,
        filteredPosts
    };
}
