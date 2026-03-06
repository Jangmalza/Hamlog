import React, { useEffect, useMemo, useState } from 'react';
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
import {
  ChevronRight,
  Edit2,
  Files,
  FolderPlus,
  FolderTree,
  GripVertical,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import type { CategoryNode, CategoryTreeResult } from '../../../utils/categoryTree';
import {
  flattenCategoryTree,
  getCategoryPathLabel
} from '../../../utils/categoryTree';
import { normalizeCategoryKey } from '../../../utils/category';

interface CategorySectionProps {
  categoryTree: CategoryTreeResult;
  managedCategoryIds: Set<string>;
  categoriesLoading: boolean;
  categoriesError: string;
  parentOptions: Array<{ id: string; label: string }>;
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
  activeCategoryId: string | null;
  managedCategoryIds: Set<string>;
  defaultCategory: string;
  categorySaving: boolean;
  parentOptions: Array<{ id: string; label: string }>;
  onSelectCategory: (nodeId: string) => void;
  onUpdateCategory: (
    node: CategoryNode,
    updates: { name?: string; parentId?: string | null }
  ) => void | Promise<void>;
  onAddCategory: (name?: string, parentId?: string | null) => void | Promise<void>;
  onDeleteCategory: (node: CategoryNode) => void;
  children?: React.ReactNode;
}

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

const CategoryItem: React.FC<CategoryItemProps> = ({
  node,
  depth,
  activeCategoryId,
  managedCategoryIds,
  defaultCategory,
  categorySaving,
  parentOptions,
  onSelectCategory,
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
    opacity: isDragging ? 0.45 : 1,
    paddingLeft: depth * 16
  };

  const hasChildren = node.children.length > 0;
  const isManaged = managedCategoryIds.has(node.id);
  const isDefault = normalizeCategoryKey(node.name) === normalizeCategoryKey(defaultCategory);
  const isActive = activeCategoryId === node.id;
  const descendantIds = isEditing ? getDescendantIds(node) : new Set<string>();

  const startEdit = () => {
    setIsEditing(true);
    setEditingName(node.name);
    setEditingParentId(node.parentId ?? '');
    onSelectCategory(node.id);
  };

  const saveEdit = async () => {
    try {
      await onUpdateCategory(node, {
        name: editingName,
        parentId: editingParentId || null
      });
      setIsEditing(false);
    } catch {
      // Keep edit state on failure.
    }
  };

  const submitAddChild = async () => {
    if (!childDraft.trim()) {
      setIsAddingChild(false);
      return;
    }

    try {
      await onAddCategory(childDraft, node.id);
      setChildDraft('');
      setIsAddingChild(false);
      setIsExpanded(true);
    } catch {
      // Keep input for retry.
    }
  };

  const handleChildKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitAddChild();
      return;
    }

    if (event.key === 'Escape') {
      setIsAddingChild(false);
      setChildDraft('');
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="mb-2 flex items-start gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="mt-2 flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            aria-label={`${node.name} 토글`}
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="mt-2 block h-6 w-6 flex-shrink-0" />
        )}

        <div
          className={`group flex flex-1 items-start justify-between gap-3 rounded-lg border p-3 transition-all ${
            isActive
              ? 'border-[color:var(--accent)] bg-[var(--surface)] shadow-[0_18px_40px_-26px_rgba(10,43,40,0.65)] ring-1 ring-[color:var(--accent-soft)]'
              : 'border-[color:var(--border)] bg-[var(--surface-muted)] hover:border-[color:var(--accent)] hover:bg-[var(--surface)]'
          }`}
          onClick={() => onSelectCategory(node.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectCategory(node.id);
            }
          }}
        >
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isManaged && !isDefault && !categorySaving && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab rounded-lg border border-[color:var(--border)] p-1 text-[var(--text-muted)] transition hover:text-[var(--text)] active:cursor-grabbing"
                  onClick={(event) => event.stopPropagation()}
                >
                  <GripVertical size={14} />
                </div>
              )}
              <p className="truncate text-sm font-semibold text-[var(--text)]">{node.name}</p>
              {isDefault && (
                <span className="rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-strong)]">
                  기본
                </span>
              )}
              {!isManaged && (
                <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  자동 감지
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span className="rounded-lg bg-[var(--surface)] px-2 py-1">
                전체 {node.count}개 글
              </span>
              <span className="rounded-lg bg-[var(--surface)] px-2 py-1">
                직속 {node.directCount}
              </span>
              <span className="rounded-lg bg-[var(--surface)] px-2 py-1">
                하위 {node.children.length}
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsAddingChild(true);
                setIsExpanded(true);
                onSelectCategory(node.id);
              }}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--accent)] disabled:opacity-40"
              title="하위 카테고리 추가"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                startEdit();
              }}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--accent)] disabled:opacity-40"
              title="수정"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteCategory(node);
              }}
              disabled={!isManaged || isDefault || categorySaving}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-red-500 disabled:opacity-40"
              title="삭제"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mb-3 ml-8 rounded-lg border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-inner">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                이름 수정
              </label>
              <input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveEdit();
                  if (event.key === 'Escape') setIsEditing(false);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                상위 변경
              </label>
              <select
                value={editingParentId}
                onChange={(event) => setEditingParentId(event.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[color:var(--accent)]"
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
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={categorySaving}
                className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}

        {isAddingChild && (
          <div className="mb-2 flex items-center gap-2" style={{ paddingLeft: (depth + 1) * 16 }}>
            <span className="block h-6 w-6 flex-shrink-0" />
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-[color:var(--accent)] bg-[var(--surface)] p-3">
              <span className="text-[var(--accent)]">
                <Plus size={14} />
              </span>
              <input
                value={childDraft}
                onChange={(event) => setChildDraft(event.target.value)}
                onKeyDown={handleChildKeyDown}
                className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="새 하위 카테고리 이름"
                autoFocus
              />
              <button
                type="button"
                onClick={() => void submitAddChild()}
                className="rounded-lg bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-strong)]"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryTree,
  managedCategoryIds,
  categoriesLoading,
  categoriesError,
  parentOptions,
  onAddCategory,
  onUpdateCategory,
  onReorderCategory,
  onDeleteCategory,
  onReload,
  categorySaving,
  defaultCategory
}) => {
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [rootDraft, setRootDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [detailName, setDetailName] = useState('');
  const [detailParentId, setDetailParentId] = useState('');
  const [detailChildDraft, setDetailChildDraft] = useState('');

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

  const summary = useMemo(() => {
    const defaultNode = categoryTree.nodesByKey.get(normalizeCategoryKey(defaultCategory));
    const managedCount = flattened.filter(({ node }) => managedCategoryIds.has(node.id)).length;
    const autoDetectedCount = flattened.filter(({ node }) => !managedCategoryIds.has(node.id)).length;

    return {
      managedCount,
      autoDetectedCount,
      rootCount: categoryTree.roots.length,
      uncategorizedCount: defaultNode?.count ?? 0
    };
  }, [categoryTree.nodesByKey, categoryTree.roots.length, defaultCategory, flattened, managedCategoryIds]);

  useEffect(() => {
    if (activeCategoryId && categoryTree.nodesById.has(activeCategoryId)) return;

    const defaultNode = categoryTree.nodesByKey.get(normalizeCategoryKey(defaultCategory));
    setActiveCategoryId(defaultNode?.id ?? categoryTree.roots[0]?.id ?? null);
  }, [activeCategoryId, categoryTree.nodesById, categoryTree.nodesByKey, categoryTree.roots, defaultCategory]);

  const activeCategory = useMemo(
    () => (activeCategoryId ? categoryTree.nodesById.get(activeCategoryId) ?? null : null),
    [activeCategoryId, categoryTree.nodesById]
  );

  useEffect(() => {
    if (!activeCategory) {
      setDetailName('');
      setDetailParentId('');
      setDetailChildDraft('');
      return;
    }

    setDetailName(activeCategory.name);
    setDetailParentId(activeCategory.parentId ?? '');
    setDetailChildDraft('');
  }, [activeCategory]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return flattened.filter(({ node }) => {
      const path = getCategoryPathLabel(node, categoryTree.nodesById).toLowerCase();
      return node.name.toLowerCase().includes(query) || path.includes(query);
    });
  }, [categoryTree.nodesById, flattened, searchQuery]);

  const findParent = (
    id: string,
    nodes: CategoryNode[],
    parentId: string | null = null
  ): { parentId: string | null; siblings: CategoryNode[] } | null => {
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

    if (!over || active.id === over.id) return;

    const activeInfo = findParent(active.id as string, categoryTree.roots);
    const overInfo = findParent(over.id as string, categoryTree.roots);

    if (!activeInfo || !overInfo) return;
    if (activeInfo.parentId !== overInfo.parentId) return;

    const siblings = activeInfo.siblings;
    const oldIndex = siblings.findIndex(node => node.id === active.id);
    const newIndex = siblings.findIndex(node => node.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(siblings.map(node => node.id), oldIndex, newIndex);
    void onReorderCategory(activeInfo.parentId, nextOrder);
  };

  const SortableRecursiveList: React.FC<{ nodes: CategoryNode[]; depth: number }> = ({
    nodes,
    depth
  }) => (
    <SortableContext
      items={nodes.map(node => node.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="flex flex-col gap-2">
        {nodes.map(node => (
          <CategoryItem
            key={node.id}
            node={node}
            depth={depth}
            activeCategoryId={activeCategoryId}
            managedCategoryIds={managedCategoryIds}
            defaultCategory={defaultCategory}
            categorySaving={categorySaving}
            parentOptions={parentOptions}
            onSelectCategory={setActiveCategoryId}
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

  const activeCategoryPath = activeCategory
    ? getCategoryPathLabel(activeCategory, categoryTree.nodesById)
    : '';

  const canEditActiveCategory = Boolean(
    activeCategory
      && managedCategoryIds.has(activeCategory.id)
      && normalizeCategoryKey(activeCategory.name) !== normalizeCategoryKey(defaultCategory)
  );

  const detailHasChanges = Boolean(
    activeCategory
      && (
        detailName.trim() !== activeCategory.name
        || (detailParentId || null) !== (activeCategory.parentId ?? null)
      )
  );

  const activeDescendantIds = useMemo(
    () => (activeCategory ? getDescendantIds(activeCategory) : new Set<string>()),
    [activeCategory]
  );

  const availableParentOptions = useMemo(() => {
    if (!activeCategory) return parentOptions;
    return parentOptions.filter(
      option => option.id !== activeCategory.id && !activeDescendantIds.has(option.id)
    );
  }, [activeCategory, activeDescendantIds, parentOptions]);

  const saveActiveCategory = async () => {
    if (!activeCategory) return;
    await onUpdateCategory(activeCategory, {
      name: detailName,
      parentId: detailParentId || null
    });
  };

  const addChildFromPanel = async () => {
    if (!activeCategory || !detailChildDraft.trim()) return;
    await onAddCategory(detailChildDraft, activeCategory.id);
    setDetailChildDraft('');
  };

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(6,55,48,0.08),rgba(255,255,255,0)_55%),linear-gradient(180deg,var(--surface),var(--surface))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--text-muted)]">
              카테고리 관리
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
                트리와 상세 패널로 정리하는 카테고리 운영
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                검색, 드래그 정렬, 상세 편집을 한 화면에 모아 운영 흐름이 바로 보이도록
                정리했습니다. 선택한 카테고리의 글 수와 하위 구조도 우측 패널에서 바로
                확인할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReload}
            disabled={categoriesLoading}
            className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            새로고침
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <FolderTree size={14} />
              관리 카테고리
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.managedCount}</p>
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <Layers3 size={14} />
              최상위 묶음
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.rootCount}</p>
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <Files size={14} />
              미분류 글
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.uncategorizedCount}</p>
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <Sparkles size={14} />
              자동 감지
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.autoDetectedCount}</p>
          </div>
        </div>
      </div>

      {categoriesLoading && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">카테고리 불러오는 중...</p>
      )}
      {categoriesError && <p className="mt-4 text-xs text-red-500">{categoriesError}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
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
                      onClick={() => setActiveCategoryId(node.id)}
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
                  <SortableRecursiveList nodes={categoryTree.roots} depth={0} />
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

        <aside className="space-y-4 xl:sticky xl:top-28 self-start">
          <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-5">
            {activeCategory ? (
              <>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      선택한 카테고리
                    </p>
                    <h3 className="text-xl font-semibold text-[var(--text)]">
                      {activeCategory.name}
                    </h3>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      {activeCategoryPath}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {normalizeCategoryKey(activeCategory.name) === normalizeCategoryKey(defaultCategory) && (
                      <span className="rounded-lg bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-strong)]">
                        기본 카테고리
                      </span>
                    )}
                    {managedCategoryIds.has(activeCategory.id) ? (
                      <span className="rounded-lg bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--text)]">
                        관리 대상
                      </span>
                    ) : (
                      <span className="rounded-lg bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        자동 감지
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-center">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      전체
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--text)]">
                      {activeCategory.count}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-center">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      직속
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--text)]">
                      {activeCategory.directCount}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-center">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      하위
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--text)]">
                      {activeCategory.children.length}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      이름
                    </label>
                    <input
                      value={detailName}
                      onChange={(event) => setDetailName(event.target.value)}
                      disabled={!canEditActiveCategory || categorySaving}
                      className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      상위 카테고리
                    </label>
                    <select
                      value={detailParentId}
                      onChange={(event) => setDetailParentId(event.target.value)}
                      disabled={!canEditActiveCategory || categorySaving}
                      className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">최상위</option>
                      {availableParentOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {canEditActiveCategory ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveActiveCategory()}
                        disabled={!detailHasChanges || categorySaving}
                        className="flex-1 rounded-lg bg-[var(--text)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        변경 저장
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(activeCategory)}
                        disabled={categorySaving}
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        삭제
                      </button>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
                      {normalizeCategoryKey(activeCategory.name) === normalizeCategoryKey(defaultCategory)
                        ? '기본 카테고리는 이름과 위치를 수정할 수 없습니다.'
                        : '자동 감지 카테고리는 글 데이터에서 생성된 항목입니다. 이름 변경은 관련 글을 정리한 뒤 반영하는 편이 안전합니다.'}
                    </p>
                  )}
                </div>

                <div className="mt-5 rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      하위 카테고리
                    </p>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {activeCategory.children.length}개
                    </span>
                  </div>

                  {canEditActiveCategory && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={detailChildDraft}
                        onChange={(event) => setDetailChildDraft(event.target.value)}
                        placeholder="바로 하위 카테고리 추가"
                        className="flex-1 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => void addChildFromPanel()}
                        disabled={!detailChildDraft.trim() || categorySaving}
                        className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeCategory.children.length > 0 ? (
                      activeCategory.children.map(child => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setActiveCategoryId(child.id)}
                          className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
                        >
                          {child.name} · {child.count}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">
                        아직 하위 카테고리가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--border)] px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                카테고리를 선택하면 상세 정보가 여기에 표시됩니다.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CategorySection;
