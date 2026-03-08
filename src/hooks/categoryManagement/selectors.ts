import type { Post } from '../../data/blogData';
import type { Category } from '../../types/category';
import { DEFAULT_CATEGORY, normalizeCategoryKey } from '../../utils/category';
import { buildCategoryTree, flattenCategoryTree } from '../../utils/categoryTree';
import type { CategoryManagementDerivedState } from './types';

interface BuildCategoryManagementStateOptions {
  categories: Category[];
  posts: Post[];
}

export function buildCategoryManagementState({
  categories,
  posts
}: BuildCategoryManagementStateOptions): CategoryManagementDerivedState {
  const categoryTree = buildCategoryTree({
    categories,
    posts,
    defaultCategory: DEFAULT_CATEGORY
  });
  const managedCategoryIds = new Set(categories.map(category => category.id));
  const parentOptions = flattenCategoryTree(categoryTree.roots)
    .filter(
      ({ node }) =>
        managedCategoryIds.has(node.id) &&
        normalizeCategoryKey(node.name) !== normalizeCategoryKey(DEFAULT_CATEGORY)
    )
    .map(({ node, depth }) => ({
      id: node.id,
      label: `${'-- '.repeat(depth)}${node.name}`
    }));

  return {
    categoryTree,
    availableCategories: categoryTree.allNames,
    parentOptions,
    managedCategoryIds
  };
}
