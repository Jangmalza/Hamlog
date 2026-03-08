import React, { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { FolderPlus, Search } from 'lucide-react';
import type { CategoryNode } from '../../../utils/categoryTree';
import { flattenCategoryTree, getCategoryPathLabel } from '../../../utils/categoryTree';
import CategoryTreeItem from './CategoryTreeItem';
import { findCategoryParent } from './categoryTreeUtils';
import type { CategoryTreePanelProps } from './types';

interface SortableRecursiveListProps extends Omit<CategoryTreePanelProps, 'categoryTree'> {
  nodes: CategoryNode[];
  depth: number;
}

const SortableRecursiveList: React.FC<SortableRecursiveListProps> = ({
  nodes,
  depth,
  managedCategoryIds,
  activeCategoryId,
  parentOptions,
  defaultCategory,
  categorySaving,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onReorderCategory,
  onDeleteCategory
}) => (
  <SortableContext
    items={nodes.map(node => node.id)}
    strategy={verticalListSortingStrategy}
  >
    <div className="flex flex-col gap-2">
      {nodes.map(node => (
        <CategoryTreeItem
          key={node.id}
          node={node}
          depth={depth}
          activeCategoryId={activeCategoryId}
          managedCategoryIds={managedCategoryIds}
          defaultCategory={defaultCategory}
          categorySaving={categorySaving}
          parentOptions={parentOptions}
          onSelectCategory={onSelectCategory}
          onUpdateCategory={onUpdateCategory}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
        >
          {node.children.length > 0 && (
            <div className="mt-2">
              <SortableRecursiveList
                nodes={node.children}
                depth={depth + 1}
                managedCategoryIds={managedCategoryIds}
                activeCategoryId={activeCategoryId}
                parentOptions={parentOptions}
                defaultCategory={defaultCategory}
                categorySaving={categorySaving}
                onSelectCategory={onSelectCategory}
                onAddCategory={onAddCategory}
                onUpdateCategory={onUpdateCategory}
                onReorderCategory={onReorderCategory}
                onDeleteCategory={onDeleteCategory}
              />
            </div>
          )}
        </CategoryTreeItem>
      ))}
    </div>
  </SortableContext>
);

const CategoryTreePanel: React.FC<CategoryTreePanelProps> = ({
  categoryTree,
  managedCategoryIds,
  activeCategoryId,
  parentOptions,
  defaultCategory,
  categorySaving,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onReorderCategory,
  onDeleteCategory
}) => {
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [rootDraft, setRootDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const flattened = useMemo(() => flattenCategoryTree(categoryTree.roots), [categoryTree.roots]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return flattened.filter(({ node }) => {
      const path = getCategoryPathLabel(node, categoryTree.nodesById).toLowerCase();
      return node.name.toLowerCase().includes(query) || path.includes(query);
    });
  }, [categoryTree.nodesById, flattened, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeInfo = findCategoryParent(active.id as string, categoryTree.roots);
    const overInfo = findCategoryParent(over.id as string, categoryTree.roots);

    if (!activeInfo || !overInfo) return;
    if (activeInfo.parentId !== overInfo.parentId) return;

    const siblings = activeInfo.siblings;
    const oldIndex = siblings.findIndex(node => node.id === active.id);
    const newIndex = siblings.findIndex(node => node.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(siblings.map(node => node.id), oldIndex, newIndex);
    void onReorderCategory(activeInfo.parentId, nextOrder);
  };

  const submitAddRoot = async () => {
    if (!rootDraft.trim()) {
      setIsAddingRoot(false);
      return;
    }

    try {
      await onAddCategory(rootDraft, null);
      setRootDraft('');
      setIsAddingRoot(false);
    } catch {
      // Keep input for retry.
    }
  };

  const handleRootKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitAddRoot();
      return;
    }

    if (event.key === 'Escape') {
      setIsAddingRoot(false);
      setRootDraft('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="카테고리 이름이나 경로 검색"
            className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          왼쪽 트리에서는 정렬과 빠른 수정, 오른쪽 패널에서는 선택한 카테고리의 상세
          편집과 하위 구조를 확인할 수 있습니다.
        </p>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              카테고리 트리
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              드래그 정렬은 같은 깊이의 형제 카테고리끼리만 가능합니다.
            </p>
          </div>
          {!isAddingRoot && (
            <button
              type="button"
              onClick={() => setIsAddingRoot(true)}
              className="rounded-lg bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90"
            >
              새 카테고리
            </button>
          )}
        </div>

        {searchQuery.trim() ? (
          <div className="space-y-3">
            {searchResults.length > 0 ? (
              searchResults.map(({ node, depth }) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelectCategory(node.id)}
                  className={`flex w-full items-start justify-between gap-4 rounded-lg border px-4 py-3 text-left transition ${
                    activeCategoryId === node.id
                      ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                      : 'border-[color:var(--border)] bg-[var(--surface-muted)] hover:border-[color:var(--accent)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{node.name}</p>
                    <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                      깊이 {depth + 1} · {getCategoryPathLabel(node, categoryTree.nodesById)}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-lg bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                    {node.count}개
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                검색된 카테고리가 없습니다.
              </div>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {categoryTree.roots.length > 0 ? (
              <SortableRecursiveList
                nodes={categoryTree.roots}
                depth={0}
                managedCategoryIds={managedCategoryIds}
                activeCategoryId={activeCategoryId}
                parentOptions={parentOptions}
                defaultCategory={defaultCategory}
                categorySaving={categorySaving}
                onSelectCategory={onSelectCategory}
                onAddCategory={onAddCategory}
                onUpdateCategory={onUpdateCategory}
                onReorderCategory={onReorderCategory}
                onDeleteCategory={onDeleteCategory}
              />
            ) : (
              !isAddingRoot && (
                <span className="mb-4 block text-sm text-[var(--text-muted)]">
                  등록된 카테고리가 없습니다.
                </span>
              )
            )}
          </DndContext>
        )}

        {isAddingRoot ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--accent)] bg-[var(--surface-muted)] p-3">
            <FolderPlus size={16} className="text-[var(--accent)]" />
            <input
              value={rootDraft}
              onChange={(event) => setRootDraft(event.target.value)}
              onKeyDown={handleRootKeyDown}
              className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="새 최상위 카테고리 이름"
              autoFocus
            />
            <button
              type="button"
              onClick={() => void submitAddRoot()}
              className="rounded-lg bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-strong)]"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingRoot(false);
                setRootDraft('');
              }}
              className="rounded-lg border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)]"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingRoot(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)]"
          >
            <FolderPlus size={16} />
            새 최상위 카테고리 추가
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryTreePanel;
