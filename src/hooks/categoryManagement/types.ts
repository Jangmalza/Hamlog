import type { Post } from '../../data/blogData';
import type { PostDraft } from '../../types/admin';
import type { Category } from '../../types/category';
import type { CategoryTreeResult } from '../../utils/categoryTree';

export interface UseCategoryManagementProps {
  posts: Post[];
  draftCategory: PostDraft['category'];
  setDraftCategory: (category: string) => void;
  refreshPosts: () => Promise<void>;
  setNotice: (message: string) => void;
}

export interface CategoryParentOption {
  id: string;
  label: string;
}

export interface CategoryManagementDerivedState {
  categoryTree: CategoryTreeResult;
  availableCategories: string[];
  parentOptions: CategoryParentOption[];
  managedCategoryIds: Set<string>;
}

export interface CategoryMutationHandlers {
  addCategory: (name: string, parentId?: string | null) => Promise<Category[]>;
  removeCategory: (id: string) => Promise<Category[]>;
  updateCategory: (
    id: string,
    payload: { name?: string; parentId?: string | null }
  ) => Promise<Category[]>;
  reorderCategories: (parentId: string | null, orderedIds: string[]) => Promise<Category[]>;
}
