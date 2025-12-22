import { useCallback, useMemo, useState } from 'react';
import type { Post } from '../data/blogData';

import type { PostDraft } from '../types/admin';
import { useCategories } from './useCategories';
import {
  DEFAULT_CATEGORY,
  normalizeCategoryKey,
  normalizeCategoryName,
  normalizeDraftCategory
} from '../utils/category';
import { buildCategoryTree, flattenCategoryTree } from '../utils/categoryTree';

interface UseCategoryManagementProps {
  posts: Post[];
  draftCategory: PostDraft['category'];
  setDraftCategory: (category: string) => void;
  refreshPosts: () => Promise<void>;
  setNotice: (message: string) => void;
}

export const useCategoryManagement = ({
  posts,
  draftCategory,
  setDraftCategory,
  refreshPosts,
  setNotice
}: UseCategoryManagementProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');

  const {
    categories,
    loading: categoriesLoading,
    saving: categorySaving,
    error: categoriesError,
    setError: setCategoriesError,
    loadCategories,
    addCategory,
    removeCategory,
    updateCategory,
    reorderCategories
  } = useCategories();

  const categoryTree = useMemo(
    () =>
      buildCategoryTree({
        categories,
        posts,
        defaultCategory: DEFAULT_CATEGORY
      }),
    [categories, posts]
  );

  const availableCategories = useMemo(
    () => categoryTree.allNames,
    [categoryTree]
  );

  const parentOptions = useMemo(() => {
    const managedIds = new Set(categories.map(category => category.id));
    const flattened = flattenCategoryTree(categoryTree.roots);
    return flattened
      .filter(
        ({ node }) =>
          managedIds.has(node.id) &&
          normalizeCategoryKey(node.name) !== normalizeCategoryKey(DEFAULT_CATEGORY)
      )
      .map(({ node, depth }) => ({
        id: node.id,
        label: `${'-- '.repeat(depth)}${node.name}`
      }));
  }, [categoryTree, categories]);

  const managedCategoryIds = useMemo(
    () => new Set(categories.map(category => category.id)),
    [categories]
  );

  const handleAddCategory = useCallback(
    async (overrideName?: string, overrideParentId?: string | null) => {
      if (categorySaving) return;
      const rawName = overrideName !== undefined ? overrideName : categoryInput;
      const normalized = normalizeCategoryName(rawName);
      if (!normalized) {
        setCategoriesError('카테고리 이름을 입력하세요.');
        return;
      }
      const key = normalizeCategoryKey(normalized);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        setCategoriesError('기본 카테고리는 자동으로 포함됩니다.');
        setCategoryInput('');
        return;
      }
      const exists = availableCategories.some(
        category => normalizeCategoryKey(category) === key
      );
      if (exists) {
        setCategoriesError('이미 존재하는 카테고리입니다.');
        setCategoryInput('');
        return;
      }
      const parentId =
        overrideParentId !== undefined ? overrideParentId : parentCategoryId.trim() || null;
      if (parentId && !categoryTree.nodesById.has(parentId)) {
        setCategoriesError('상위 카테고리를 다시 선택하세요.');
        return;
      }
      setCategoriesError('');
      try {
        await addCategory(normalized, parentId);
        if (overrideName === undefined) {
          setCategoryInput('');
        }
        if (overrideParentId === undefined) {
          setParentCategoryId('');
        }
        setNotice('카테고리를 추가했습니다.');
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '카테고리 추가에 실패했습니다.';
        setCategoriesError(message);
      }
    },
    [
      addCategory,
      availableCategories,
      categoryInput,
      categorySaving,
      categoryTree.nodesById,
      parentCategoryId,
      setNotice,
      setCategoriesError
    ]
  );

  const handleDeleteCategory = useCallback(
    async (category: { id: string; name: string }) => {
      if (categorySaving) return;
      const normalized = normalizeDraftCategory(category.name, DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        setCategoriesError('기본 카테고리는 삭제할 수 없습니다.');
        return;
      }
      const node = categoryTree.nodesById.get(category.id);
      const count = node?.directCount ?? 0;
      const childCount = node?.children.length ?? 0;
      const message =
        count > 0
          ? `"${normalized}" 카테고리를 삭제하면 ${count}개의 글이 미분류로 이동합니다. 계속할까요?`
          : `"${normalized}" 카테고리를 삭제할까요?`;
      const childMessage =
        childCount > 0
          ? '하위 카테고리는 상위 연결이 해제되어 최상위로 이동합니다.'
          : '';
      const confirmMessage = childMessage ? `${message}\n${childMessage}` : message;
      if (!window.confirm(confirmMessage)) return;
      setCategoriesError('');
      try {
        await removeCategory(category.id);
        if (normalizeCategoryKey(draftCategory) === key) {
          setDraftCategory(DEFAULT_CATEGORY);
        }
        void refreshPosts();
        setNotice('카테고리를 삭제했습니다.');
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '카테고리 삭제에 실패했습니다.';
        setCategoriesError(message);
      }
    },
    [
      categorySaving,
      categoryTree.nodesById,
      draftCategory,
      refreshPosts,
      removeCategory,
      setCategoriesError,
      setDraftCategory,
      setNotice
    ]
  );

  const handleUpdateCategory = useCallback(
    async (
      category: { id: string; name: string; parentId: string | null },
      updates: { name?: string; parentId?: string | null }
    ) => {
      if (categorySaving) return;
      const nextName =
        updates.name !== undefined ? normalizeCategoryName(updates.name) : category.name;
      if (!nextName) {
        setCategoriesError('카테고리 이름을 입력하세요.');
        return;
      }
      const key = normalizeCategoryKey(nextName);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        setCategoriesError('기본 카테고리는 사용할 수 없습니다.');
        return;
      }
      const nameChanged = normalizeCategoryKey(category.name) !== key;
      if (nameChanged) {
        const exists = availableCategories.some(
          item => normalizeCategoryKey(item) === key
        );
        if (exists) {
          setCategoriesError('이미 존재하는 카테고리입니다.');
          return;
        }
      }
      const parentId =
        updates.parentId !== undefined ? updates.parentId || null : category.parentId ?? null;
      if (parentId && !categoryTree.nodesById.has(parentId)) {
        setCategoriesError('상위 카테고리를 다시 선택하세요.');
        return;
      }
      const payload: { name?: string; parentId?: string | null } = {};
      if (nameChanged) payload.name = nextName;
      if (parentId !== category.parentId) payload.parentId = parentId;
      if (Object.keys(payload).length === 0) {
        return;
      }

      setCategoriesError('');
      try {
        await updateCategory(category.id, payload);
        if (
          nameChanged &&
          normalizeCategoryKey(draftCategory) === normalizeCategoryKey(category.name)
        ) {
          setDraftCategory(nextName);
        }
        if (nameChanged) {
          void refreshPosts();
        }
        setNotice('카테고리를 수정했습니다.');
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '카테고리 수정에 실패했습니다.';
        setCategoriesError(message);
      }
    },
    [
      availableCategories,
      categorySaving,
      categoryTree.nodesById,
      draftCategory,
      refreshPosts,
      setCategoriesError,
      setDraftCategory,
      setNotice,
      updateCategory
    ]
  );

  const handleReorderCategory = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      if (categorySaving) return;
      setCategoriesError('');
      try {
        await reorderCategories(parentId, orderedIds);
        setNotice('카테고리 순서를 변경했습니다.');
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '카테고리 순서 변경에 실패했습니다.';
        setCategoriesError(message);
      }
    },
    [categorySaving, reorderCategories, setCategoriesError, setNotice]
  );

  return {
    categories,
    categoriesLoading,
    categorySaving,
    categoriesError,
    setCategoriesError,
    loadCategories,
    categoryInput,
    parentCategoryId,
    setCategoryInput,
    setParentCategoryId,
    categoryTree,
    parentOptions,
    managedCategoryIds,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleReorderCategory
  };
};
