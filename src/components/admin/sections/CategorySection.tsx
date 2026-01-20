import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
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

interface CategoryItemProps {
  node: CategoryNode;
  depth: number;
  managedCategoryIds: Set<string>;
  defaultCategory: string;
  categorySaving: boolean;
  parentOptions: Array<{ id: string; label: string }>;
  onUpdateCategory: (node: CategoryNode, updates: { name?: string; parentId?: string | null }) => void | Promise<void>;
  onAddCategory: (name?: string, parentId?: string | null) => void | Promise<void>;
  onDeleteCategory: (node: CategoryNode) => void;
  children?: React.ReactNode;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  node,
  depth,
  managedCategoryIds,
  defaultCategory,
  categorySaving,
  parentOptions,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingParentId, setEditingParentId] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childDraft, setChildDraft] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: depth * 14
  };

  const hasChildren = node.children.length > 0;
  const isManaged = managedCategoryIds.has(node.id);
  const isDefault = normalizeCategoryKey(node.name) === normalizeCategoryKey(defaultCategory);

  const startEdit = () => {
    setIsEditing(true);
    setEditingName(node.name);
    setEditingParentId(node.parentId ?? '');
  };

  const saveEdit = async () => {
    try {
      await onUpdateCategory(node, {
        name: editingName,
        parentId: editingParentId || null
      });
      setIsEditing(false);
    } catch {
      // keep editing state on error
    }
  };

  const submitAddChild = async () => {
    try {
      await onAddCategory(childDraft, node.id);
      setIsAddingChild(false);
      setChildDraft('');
      // Force expand when adding child
      setIsExpanded(true);
    } catch {
      // keep input for retry
    }
  };

  // Helper to filter out descendants in parent select
  const getDescendantIds = (root: CategoryNode) => {
    const ids = new Set<string>();
    const walk = (current: CategoryNode) => {
      current.children.forEach(child => {
        ids.add(child.id);
        walk(child);
      });
    };
    walk(root);
    return ids;
  };
  const descendantIds = isEditing ? getDescendantIds(node) : new Set<string>();

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="flex items-center gap-2 mb-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] transition-colors"
            aria-label={`${node.name} 토글`}
          >
            <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="h-6 w-6 flex-shrink-0" />
        )}

        <div className="flex flex-1 items-center justify-between rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text)] transition-all hover:border-[var(--accent)] hover:shadow-sm">
          <div className="flex items-center gap-3">
            {isManaged && !isDefault && !categorySaving && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text)] active:cursor-grabbing p-1 -ml-1 border-r border-[var(--border)] pr-2"
              >
                <GripVertical size={16} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium leading-tight">{node.name}</span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {node.count}개 글
              </span>
            </div>
            {!isManaged && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                미등록
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsAddingChild(true)}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
              title="하위 카테고리 추가"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={startEdit}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
              title="수정"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCategory(node)}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-red-500 disabled:opacity-50 transition-colors"
              title="삭제"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Editing State */}
      {isEditing && (
        <div className="mb-2 ml-8 rounded-xl border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-inner">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">이름 수정</label>
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs focus:border-[var(--accent)] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">상위 변경</label>
              <select
                value={editingParentId}
                onChange={(e) => setEditingParentId(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs focus:border-[var(--accent)] outline-none"
              >
                <option value="">최상위</option>
                {parentOptions
                  .filter(opt => opt.id !== node.id && !descendantIds.has(opt.id))
                  .map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={categorySaving}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adding Child State */}
      {isAddingChild && (
        <div className="mb-2 ml-8 rounded-xl border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-inner">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">하위 카테고리 이름</label>
              <input
                value={childDraft}
                onChange={(e) => setChildDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submitAddChild()}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs focus:border-[var(--accent)] outline-none"
                autoFocus
                placeholder="예: 리액트"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={submitAddChild}
                disabled={categorySaving}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAddingChild(false)}
                className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recursive Children - Only show if expanded */}
      <div className={`transition-all overflow-hidden ${isExpanded ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findParent = (id: string, nodes: CategoryNode[], parentId: string | null = null): { parentId: string | null, siblings: CategoryNode[] } | null => {
    for (const node of nodes) {
      if (node.id === id) return { parentId, siblings: nodes };
      if (node.children.length > 0) {
        const result = findParent(id, node.children, node.id);
        if (result) return result;
      }
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    // Find siblings for the active item
    const activeInfo = findParent(active.id as string, categoryTree.roots);
    const overInfo = findParent(over.id as string, categoryTree.roots);

    if (!activeInfo || !overInfo) return;

    // Only allow reordering within same parent (siblings)
    if (activeInfo.parentId !== overInfo.parentId) return;

    const siblings = activeInfo.siblings;
    const oldIndex = siblings.findIndex(n => n.id === active.id);
    const newIndex = siblings.findIndex(n => n.id === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      const newOrder = arrayMove(siblings.map(n => n.id), oldIndex, newIndex);
      void onReorderCategory(activeInfo.parentId, newOrder);
    }
  };

  // Improved separate Recursive List to avoid DndContext duplication
  const SortableRecursiveList: React.FC<{
    nodes: CategoryNode[];
    depth: number;
  }> = ({ nodes, depth }) => {

    return (
      <SortableContext
        items={nodes.map(n => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {nodes.map(node => (
            <CategoryItem
              key={node.id}
              node={node}
              depth={depth}
              managedCategoryIds={managedCategoryIds}
              defaultCategory={defaultCategory}
              categorySaving={categorySaving}
              parentOptions={parentOptions}
              onUpdateCategory={onUpdateCategory}
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
            >
              {node.children.length > 0 && (
                <div className="mt-2">
                  <SortableRecursiveList nodes={node.children} depth={depth + 1} />
                </div>
              )}
            </CategoryItem>
          ))}
        </div>
      </SortableContext>
    );
  };

  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-sm">
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
          className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          새로고침
        </button>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        카테고리를 삭제하면 해당 글은 자동으로 미분류로 이동합니다.
      </p>

      {/* Add New Category */}
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
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          상위 카테고리
          <select
            value={parentCategoryId}
            onChange={(event) => onParentCategoryChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
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
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            추가
          </button>
        </div>
      </div>

      {categoriesLoading && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">카테고리 불러오는 중...</p>
      )}
      {categoriesError && <p className="mt-3 text-xs text-red-500">{categoriesError}</p>}

      <div className="mt-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {categoryTree.roots.length > 0 ? (
            <SortableRecursiveList nodes={categoryTree.roots} depth={0} />
          ) : (
            <span className="text-xs text-[var(--text-muted)]">
              등록된 카테고리가 없습니다.
            </span>
          )}
        </DndContext>
      </div>
    </div>
  );
};

export default CategorySection;
