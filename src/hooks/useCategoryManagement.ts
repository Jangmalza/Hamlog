import { useMemo } from 'react';
import { useCategories } from './useCategories';
import { buildCategoryManagementState } from './categoryManagement/selectors';
import type { UseCategoryManagementProps } from './categoryManagement/types';
import { useCategoryManagementActions } from './categoryManagement/useCategoryManagementActions';

export const useCategoryManagement = ({
  posts,
  draftCategory,
  setDraftCategory,
  refreshPosts,
  setNotice
}: UseCategoryManagementProps) => {
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

  const derivedState = useMemo(
    () => buildCategoryManagementState({ categories, posts }),
    [categories, posts]
  );

  const {
    handleAddCategory,
    handleDeleteCategory,
    handleUpdateCategory,
    handleReorderCategory
  } = useCategoryManagementActions({
    addCategory,
    removeCategory,
    updateCategory,
    reorderCategories,
    categorySaving,
    categoryTree: derivedState.categoryTree,
    availableCategories: derivedState.availableCategories,
    draftCategory,
    setDraftCategory,
    refreshPosts,
    setNotice,
    setCategoriesError
  });

  return {
    categories,
    categoriesLoading,
    categorySaving,
    categoriesError,
    setCategoriesError,
    loadCategories,
    categoryTree: derivedState.categoryTree,
    parentOptions: derivedState.parentOptions,
    managedCategoryIds: derivedState.managedCategoryIds,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleReorderCategory
  };
};
