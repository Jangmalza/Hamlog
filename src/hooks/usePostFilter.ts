import { useMemo, useState } from 'react';
import type { Post } from '../data/blogData';
import {
    DEFAULT_CATEGORY,
    normalizeCategoryKey,
    normalizeDraftCategory
} from '../utils/category';
import { normalizePostStatus } from '../utils/postStatus';

import type { CategoryNode, CategoryTreeResult } from '../utils/categoryTree';

interface UsePostFilterProps {
    posts: Post[];
    categoryTree: CategoryTreeResult;
    itemsPerPage?: number;
}

export const usePostFilter = ({ posts, categoryTree }: UsePostFilterProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [page, setPage] = useState(1);

    const filteredPosts = useMemo(() => {
        let result = posts;

        // Filter by Search Query
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(post => {
                const fields = [
                    post.title,
                    post.summary,
                    post.slug,
                    post.tags.join(' '),
                    post.series ?? '',
                    post.category ?? ''
                ];
                return fields.some(text => text.toLowerCase().includes(q));
            });
        }

        // Filter by Status
        if (filterStatus !== 'all') {
            result = result.filter(post => normalizePostStatus(post.status) === filterStatus);
        }

        // Filter by Category
        if (filterCategory !== 'all') {
            const key = normalizeCategoryKey(filterCategory);
            const node = categoryTree.nodesByKey.get(key);

            if (node) {
                const validKeys = new Set<string>();
                const collect = (n: CategoryNode) => {
                    validKeys.add(normalizeCategoryKey(n.name));
                    n.children.forEach(collect);
                };
                collect(node);

                result = result.filter(post => {
                    const postCategory = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
                    return validKeys.has(normalizeCategoryKey(postCategory));
                });
            } else {
                result = result.filter(post => {
                    const postCategory = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
                    return normalizeCategoryKey(postCategory) === key;
                });
            }
        }

        return result;
    }, [posts, categoryTree, searchQuery, filterStatus, filterCategory]);

    // Reset page when filters change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const handleFilterStatusChange = (value: string) => {
        setFilterStatus(value);
        setPage(1);
    };

    const handleFilterCategoryChange = (value: string) => {
        setFilterCategory(value);
        setPage(1);
    };

    return {
        searchQuery,
        setSearchQuery: handleSearchChange, // Wrapper to reset page
        filterStatus,
        setFilterStatus: handleFilterStatusChange, // Wrapper to reset page
        filterCategory,
        setFilterCategory: handleFilterCategoryChange, // Wrapper to reset page
        page,
        setPage,
        filteredPosts
    };
};
