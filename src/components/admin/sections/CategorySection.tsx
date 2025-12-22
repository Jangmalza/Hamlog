import React, { useState } from 'react';
import type { CategoryNode, CategoryTreeResult } from '../../../utils/categoryTree';
import { normalizeCategoryKey } from '../../../utils/category';

interface CategorySectionProps {
  categoryTree: CategoryTreeResult;
  managedCategoryIds: Set<string>;
  categoriesLoading: boolean;
  categoriesError: string;
  categoryInput: string;
  parentCategoryId: string;
  parentOptions: Array<{ id: string; label: string }>;
  onCategoryInputChange: (value: string) => void;
  onParentCategoryChange: (value: string) => void;
  onAddCategory: (name?: string, parentId?: string | null) => void | Promise<void>;
  onUpdateCategory: (
    category: CategoryNode,
    updates: { name?: string; parentId?: string | null }
  ) => void | Promise<void>;
  onReorderCategory: (parentId: string | null, orderedIds: string[]) => void | Promise<void>;
  onDeleteCategory: (category: CategoryNode) => void;
  onReload: () => void;
  categorySaving: boolean;
  defaultCategory: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryTree,
  managedCategoryIds,
  categoriesLoading,
  categoriesError,
  categoryInput,
  parentCategoryId,
  parentOptions,
  onCategoryInputChange,
  onParentCategoryChange,
  onAddCategory,
  onUpdateCategory,
  onReorderCategory,
  onDeleteCategory,
  onReload,
  categorySaving,
  defaultCategory
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingParentId, setEditingParentId] = useState('');
  const [childDrafts, setChildDrafts] = useState<Record<string, string>>({});
  const [childOpen, setChildOpen] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpanded(prev => {
      const current = prev[id];
      return { ...prev, [id]: current === undefined ? false : !current };
    });
  };

  const startEdit = (node: CategoryNode) => {
    setEditingId(node.id);
    setEditingName(node.name);
    setEditingParentId(node.parentId ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingParentId('');
  };

  const saveEdit = async (node: CategoryNode) => {
    try {
      await onUpdateCategory(node, {
        name: editingName,
        parentId: editingParentId || null
      });
      cancelEdit();
    } catch {
      // keep editing state on error
    }
  };

  const startAddChild = (node: CategoryNode) => {
    setChildOpen(prev => ({ ...prev, [node.id]: true }));
    setChildDrafts(prev => ({ ...prev, [node.id]: prev[node.id] ?? '' }));
    setExpanded(prev => ({ ...prev, [node.id]: true }));
  };

  const cancelAddChild = (node: CategoryNode) => {
    setChildOpen(prev => ({ ...prev, [node.id]: false }));
    setChildDrafts(prev => ({ ...prev, [node.id]: '' }));
  };

  const submitAddChild = async (node: CategoryNode) => {
    const name = childDrafts[node.id] ?? '';
    try {
      await onAddCategory(name, node.id);
      cancelAddChild(node);
    } catch {
      // keep input for retry
    }
  };

  const getDescendantIds = (node: CategoryNode) => {
    const ids = new Set<string>();
    const walk = (current: CategoryNode) => {
      current.children.forEach(child => {
        ids.add(child.id);
        walk(child);
      });
    };
    walk(node);
    return ids;
  };

  const moveNode = async (node: CategoryNode, direction: 'up' | 'down') => {
    const parentId = node.parentId ?? null;
    const siblings = parentId
      ? categoryTree.nodesById.get(parentId)?.children ?? []
      : categoryTree.roots;
    const managedSiblings = siblings.filter(item => managedCategoryIds.has(item.id));
    if (managedSiblings.length < 2) return;
    const currentIndex = managedSiblings.findIndex(item => item.id === node.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= managedSiblings.length) return;
    const orderedIds = managedSiblings.map(item => item.id);
    [orderedIds[currentIndex], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[currentIndex]
    ];
    try {
      await onReorderCategory(parentId, orderedIds);
    } catch {
      // handled by parent
    }
  };

  const renderNode = (node: CategoryNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;
    const isDefault =
      normalizeCategoryKey(node.name) === normalizeCategoryKey(defaultCategory);
    const isManaged = managedCategoryIds.has(node.id);
    const paddingLeft = depth * 14;
    const isEditing = editingId === node.id;
    const descendantIds = isEditing ? getDescendantIds(node) : new Set<string>();
    const siblings = node.parentId
      ? categoryTree.nodesById.get(node.parentId)?.children ?? []
      : categoryTree.roots;
    const managedSiblings = siblings.filter(item => managedCategoryIds.has(item.id));
    const siblingIndex = managedSiblings.findIndex(item => item.id === node.id);
    const canReorder = isManaged && !categorySaving;
    const canMoveUp = canReorder && siblingIndex > 0;
    const canMoveDown =
      canReorder && siblingIndex >= 0 && siblingIndex < managedSiblings.length - 1;

    return (
      <li key={node.id}>
        <div className="flex items-center gap-2" style={{ paddingLeft }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(node.id)}
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
          <div className="flex flex-1 items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)]">
            <div className="flex items-center gap-2">
              <span>{node.name}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {node.count}개
              </span>
              {!isManaged && (
                <span className="text-[10px] text-[var(--text-muted)]">미등록</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <button
                type="button"
                onClick={() => moveNode(node, 'up')}
                disabled={!canMoveUp}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                위로
              </button>
              <button
                type="button"
                onClick={() => moveNode(node, 'down')}
                disabled={!canMoveDown}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                아래로
              </button>
              <button
                type="button"
                onClick={() => startAddChild(node)}
                disabled={!isManaged || isDefault || categorySaving}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                하위 추가
              </button>
              <button
                type="button"
                onClick={() => startEdit(node)}
                disabled={!isManaged || isDefault || categorySaving}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDeleteCategory(node)}
                disabled={!isManaged || isDefault || categorySaving}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
        {isEditing && (
          <div className="mt-2 rounded-2xl border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)]">
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                이름 수정
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text)]"
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                상위 변경
                <select
                  value={editingParentId}
                  onChange={(event) => setEditingParentId(event.target.value)}
                  className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text)]"
                >
                  <option value="">최상위</option>
                  {parentOptions
                    .filter(option => option.id !== node.id && !descendantIds.has(option.id))
                    .map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit(node)}
                  disabled={categorySaving}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-[color:var(--border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        {childOpen[node.id] && (
          <div className="mt-2 rounded-2xl border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)]">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                하위 카테고리
                <input
                  value={childDrafts[node.id] ?? ''}
                  onChange={(event) =>
                    setChildDrafts(prev => ({ ...prev, [node.id]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void submitAddChild(node);
                    }
                  }}
                  className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text)]"
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => submitAddChild(node)}
                  disabled={categorySaving}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => cancelAddChild(node)}
                  className="rounded-full border border-[color:var(--border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        {hasChildren && isExpanded && (
          <ul className="mt-2 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            카테고리 관리
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold">카테고리</h2>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={categoriesLoading}
          className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          새로고침
        </button>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        카테고리를 삭제하면 해당 글은 자동으로 미분류로 이동합니다.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          이름
          <input
            value={categoryInput}
            onChange={(event) => onCategoryInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAddCategory();
              }
            }}
            placeholder="새 카테고리 입력"
            className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          상위 카테고리
          <select
            value={parentCategoryId}
            onChange={(event) => onParentCategoryChange(event.target.value)}
            className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          >
            <option value="">최상위</option>
            {parentOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void onAddCategory()}
            disabled={categorySaving}
            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            추가
          </button>
        </div>
      </div>
      {categoriesLoading && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">카테고리 불러오는 중...</p>
      )}
      {categoriesError && <p className="mt-3 text-xs text-red-500">{categoriesError}</p>}
      <div className="mt-4 space-y-2">
        {categoryTree.roots.length > 0 ? (
          <ul className="space-y-2">{categoryTree.roots.map(node => renderNode(node, 0))}</ul>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">
            등록된 카테고리가 없습니다.
          </span>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
