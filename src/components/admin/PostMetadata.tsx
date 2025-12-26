import React, { useMemo, useState } from 'react';
import type { PostDraft } from '../../types/admin';
import type { CategoryNode, CategoryTreeResult } from '../../utils/categoryTree';
import { DEFAULT_CATEGORY, normalizeCategoryKey } from '../../utils/category';

interface PostMetadataProps {
    draft: PostDraft;
    updateDraft: (patch: Partial<PostDraft>) => void;
    categoryTree: CategoryTreeResult;
}

export const PostMetadata: React.FC<PostMetadataProps> = ({
    draft,
    updateDraft,
    categoryTree
}) => {
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categoryQuery, setCategoryQuery] = useState('');
    const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({});

    const getNodePath = (node: CategoryNode) => {
        const path: string[] = [];
        let current: CategoryNode | undefined = node;
        while (current) {
            path.unshift(current.name);
            current = current.parentId ? categoryTree.nodesById.get(current.parentId) : undefined;
        }
        return path.join(' > ');
    };

    const categoryPath = useMemo(() => {
        const name = draft.category || DEFAULT_CATEGORY;
        const key = normalizeCategoryKey(name);
        const node = categoryTree.nodesByKey.get(key);
        if (!node) return name;
        return getNodePath(node);
    }, [categoryTree, draft.category]);

    const categoryResults = useMemo(() => {
        const query = categoryQuery.trim().toLowerCase();
        if (!query) return [];
        return Array.from(categoryTree.nodesById.values())
            .filter(node => node.name.toLowerCase().includes(query))
            .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
            .map(node => ({ node, path: getNodePath(node) }));
    }, [categoryQuery, categoryTree]);

    const toggleCategoryNode = (id: string) => {
        setCategoryExpanded(prev => {
            const current = prev[id];
            return { ...prev, [id]: current === undefined ? false : !current };
        });
    };

    const selectCategory = (name: string) => {
        updateDraft({ category: name });
        setCategoryOpen(false);
        setCategoryQuery('');
    };

    const renderCategoryNode = (node: CategoryNode, depth: number) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = categoryExpanded[node.id] ?? true;
        const isActive =
            normalizeCategoryKey(draft.category || DEFAULT_CATEGORY) ===
            normalizeCategoryKey(node.name);
        const paddingLeft = depth * 14;

        return (
            <li key={node.id}>
                <div className="flex items-center gap-2" style={{ paddingLeft }}>
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleCategoryNode(node.id)}
                            className="flex h-4 w-4 items-center justify-center text-[var(--text-muted)]"
                            aria-label={`${node.name} 토글`}
                        >
                            <svg
                                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path d="M9 6l6 6-6 6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    ) : (
                        <span className="h-4 w-4" />
                    )}
                    <button
                        type="button"
                        onClick={() => selectCategory(node.name)}
                        className={`flex flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${isActive
                            ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                            : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
                            }`}
                    >
                        <span>{node.name}</span>
                        <span className="text-xs">{node.count}</span>
                    </button>
                </div>
                {hasChildren && isExpanded && (
                    <ul className="mt-2 space-y-2">
                        {node.children.map(child => renderCategoryNode(child, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="mt-6 grid gap-4 border-t border-[color:var(--border)] pt-6 md:grid-cols-12 bg-transparent">
            {/* Category - Col 6 */}
            <div className="md:col-span-6 relative group">
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">카테고리</label>
                <button
                    type="button"
                    onClick={() => setCategoryOpen(prev => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[color:var(--accent)]"
                >
                    <span className="truncate">{categoryPath || DEFAULT_CATEGORY}</span>
                    <svg className="h-3 w-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                {categoryOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                        <input
                            autoFocus
                            value={categoryQuery}
                            onChange={(e) => setCategoryQuery(e.target.value)}
                            placeholder="검색..."
                            className="mb-2 w-full rounded-lg bg-[var(--surface-muted)] px-2 py-1.5 text-xs focus:outline-none"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {/* Default Category */}
                            <button
                                onClick={() => selectCategory(DEFAULT_CATEGORY)}
                                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-muted)] text-xs"
                            >
                                {DEFAULT_CATEGORY}
                            </button>
                            {/* Tree */}
                            {categoryQuery.trim() ? (
                                categoryResults.map(res => (
                                    <button key={res.node.id} onClick={() => selectCategory(res.node.name)} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-muted)] text-xs">
                                        <div className="font-medium">{res.node.name}</div>
                                        <div className="text-[10px] text-[var(--text-muted)]">{res.path}</div>
                                    </button>
                                ))
                            ) : (
                                categoryTree.roots.filter(n => normalizeCategoryKey(n.name) !== normalizeCategoryKey(DEFAULT_CATEGORY)).map(node => renderCategoryNode(node, 0))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Date/Schedule - Col 6 */}
            <div className="md:col-span-6">
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                    {draft.status === 'scheduled' ? '예약 시간' : '발행일'}
                </label>
                {draft.status === 'scheduled' ? (
                    <input
                        type="datetime-local"
                        value={draft.scheduledAt}
                        onChange={(e) => updateDraft({ scheduledAt: e.target.value })}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
                    />
                ) : (
                    <input
                        type="date"
                        value={draft.publishedAt}
                        onChange={(e) => updateDraft({ publishedAt: e.target.value })}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
                    />
                )}
            </div>

            {/* Cover Image - Col 12 */}
            <div className="md:col-span-12">
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">대표 이미지 (URL)</label>
                <input
                    value={draft.cover}
                    onChange={(e) => updateDraft({ cover: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
                />
            </div>

            {/* Summary - Full Width */}
            <div className="md:col-span-12">
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">요약 / Featured</label>
                <div className="flex gap-2">
                    <textarea
                        value={draft.summary}
                        onChange={(e) => updateDraft({ summary: e.target.value })}
                        rows={1}
                        className="flex-1 rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none resize-none"
                        placeholder="글 요약..."
                    />
                    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 transition-colors ${draft.featured ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]'}`}>
                        <input type="checkbox" checked={draft.featured} onChange={(e) => updateDraft({ featured: e.target.checked })} className="hidden" />
                        <span className="text-xs font-bold">추천</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
