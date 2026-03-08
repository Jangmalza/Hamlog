import type { ReactNode } from 'react';
import type { CategoryNode, CategoryTreeResult } from '../../../utils/categoryTree';

export interface CategorySectionProps {
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

export interface CategoryManagementSummary {
  managedCount: number;
  autoDetectedCount: number;
  rootCount: number;
  uncategorizedCount: number;
}

export interface CategoryTreeItemProps {
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
  children?: ReactNode;
}

export interface CategoryTreePanelProps {
  categoryTree: CategoryTreeResult;
  managedCategoryIds: Set<string>;
  activeCategoryId: string | null;
  parentOptions: Array<{ id: string; label: string }>;
  defaultCategory: string;
  categorySaving: boolean;
  onSelectCategory: (nodeId: string) => void;
  onAddCategory: (name?: string, parentId?: string | null) => void | Promise<void>;
  onUpdateCategory: (
    category: CategoryNode,
    updates: { name?: string; parentId?: string | null }
  ) => void | Promise<void>;
  onReorderCategory: (parentId: string | null, orderedIds: string[]) => void | Promise<void>;
  onDeleteCategory: (category: CategoryNode) => void;
}

export interface CategoryDetailPanelProps {
  activeCategory: CategoryNode | null;
  categoryTree: CategoryTreeResult;
  managedCategoryIds: Set<string>;
  parentOptions: Array<{ id: string; label: string }>;
  defaultCategory: string;
  categorySaving: boolean;
  onSelectCategory: (nodeId: string) => void;
  onAddCategory: (name?: string, parentId?: string | null) => void | Promise<void>;
  onUpdateCategory: (
    category: CategoryNode,
    updates: { name?: string; parentId?: string | null }
  ) => void | Promise<void>;
  onDeleteCategory: (category: CategoryNode) => void;
}

export interface CategorySummaryCardsProps {
  summary: CategoryManagementSummary;
}
