import { useCallback } from 'react';
import type { PostDraft } from '../../types/admin';
import {
  DEFAULT_CATEGORY,
  normalizeCategoryKey,
  normalizeCategoryName,
  normalizeDraftCategory
} from '../../utils/category';
import type { CategoryTreeResult } from '../../utils/categoryTree';
import type { CategoryMutationHandlers } from './types';

interface CategoryManagementActionsOptions extends CategoryMutationHandlers {
  categorySaving: boolean;
  categoryTree: CategoryTreeResult;
  availableCategories: string[];
  draftCategory: PostDraft['category'];
  setDraftCategory: (category: string) => void;
  refreshPosts: () => Promise<void>;
  setNotice: (message: string) => void;
  setCategoriesError: (message: string) => void;
}

export function useCategoryManagementActions({
  addCategory,
  removeCategory,
  updateCategory,
  reorderCategories,
  categorySaving,
  categoryTree,
  availableCategories,
  draftCategory,
  setDraftCategory,
  refreshPosts,
  setNotice,
  setCategoriesError
}: CategoryManagementActionsOptions) {
  const rejectWithCategoryError = useCallback(
    (message: string): never => {
      setCategoriesError(message);
      throw new Error(message);
    },
    [setCategoriesError]
  );

  const handleAddCategory = useCallback(
    async (overrideName?: string, overrideParentId?: string | null) => {
      if (categorySaving) {
        return;
      }

      const requestedName = String(overrideName ?? '');

      if (!requestedName) {
        rejectWithCategoryError('카테고리 이름을 입력하세요.');
      }

      const normalized = normalizeCategoryName(requestedName);
      if (!normalized) {
        rejectWithCategoryError('카테고리 이름을 입력하세요.');
      }

      const key = normalizeCategoryKey(normalized);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        rejectWithCategoryError('기본 카테고리는 자동으로 포함됩니다.');
      }

      const exists = availableCategories.some(category => normalizeCategoryKey(category) === key);
      if (exists) {
        rejectWithCategoryError('이미 존재하는 카테고리입니다.');
      }

      const parentId = overrideParentId || null;
      if (parentId && !categoryTree.nodesById.has(parentId)) {
        rejectWithCategoryError('상위 카테고리가 유효하지 않습니다.');
      }

      setCategoriesError('');

      try {
        await addCategory(normalized, parentId);
        setNotice('카테고리를 추가했습니다.');
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '카테고리 추가에 실패했습니다.';
        setCategoriesError(message);
        throw error;
      }
    },
    [
      addCategory,
      availableCategories,
      categorySaving,
      categoryTree.nodesById,
      rejectWithCategoryError,
      setCategoriesError,
      setNotice
    ]
  );

  const handleDeleteCategory = useCallback(
    async (category: { id: string; name: string }) => {
      if (categorySaving) {
        return;
      }

      const normalized = normalizeDraftCategory(category.name, DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        rejectWithCategoryError('기본 카테고리는 삭제할 수 없습니다.');
      }

      const node = categoryTree.nodesById.get(category.id);
      const count = node?.directCount ?? 0;
      const childCount = node?.children.length ?? 0;
      const baseMessage =
        count > 0
          ? `"${normalized}" 카테고리를 삭제하면 ${count}개의 글이 미분류로 이동합니다. 계속할까요?`
          : `"${normalized}" 카테고리를 삭제할까요?`;
      const childMessage =
        childCount > 0
          ? '하위 카테고리는 상위 연결이 해제되어 최상위로 이동합니다.'
          : '';
      const confirmMessage = childMessage ? `${baseMessage}\n${childMessage}` : baseMessage;

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
        throw error;
      }
    },
    [
      categorySaving,
      categoryTree.nodesById,
      draftCategory,
      rejectWithCategoryError,
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
      if (categorySaving) {
        return;
      }

      const nextName =
        updates.name !== undefined ? normalizeCategoryName(updates.name) : category.name;
      if (!nextName) {
        rejectWithCategoryError('카테고리 이름을 입력하세요.');
      }

      const key = normalizeCategoryKey(nextName);
      if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        rejectWithCategoryError('기본 카테고리는 사용할 수 없습니다.');
      }

      const nameChanged = normalizeCategoryKey(category.name) !== key;
      if (nameChanged) {
        const exists = availableCategories.some(item => normalizeCategoryKey(item) === key);
        if (exists) {
          rejectWithCategoryError('이미 존재하는 카테고리입니다.');
        }
      }

      const parentId =
        updates.parentId !== undefined ? updates.parentId || null : category.parentId ?? null;
      if (parentId && !categoryTree.nodesById.has(parentId)) {
        rejectWithCategoryError('상위 카테고리를 다시 선택하세요.');
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
        throw error;
      }
    },
    [
      availableCategories,
      categorySaving,
      categoryTree.nodesById,
      draftCategory,
      rejectWithCategoryError,
      refreshPosts,
      setCategoriesError,
      setDraftCategory,
      setNotice,
      updateCategory
    ]
  );

  const handleReorderCategory = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      if (categorySaving) {
        return;
      }

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
        throw error;
      }
    },
    [categorySaving, reorderCategories, setCategoriesError, setNotice]
  );

  return {
    handleAddCategory,
    handleDeleteCategory,
    handleUpdateCategory,
    handleReorderCategory
  };
}
