import type { Post } from '../data/blogData';
import type { Category } from '../types/category';
import { DEFAULT_CATEGORY, normalizeCategoryKey, normalizeCategoryName, sortCategories } from './category';

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  children: CategoryNode[];
  count: number;
  directCount: number;
  hasNew: boolean;
}

export interface CategoryTreeResult {
  roots: CategoryNode[];
  nodesByKey: Map<string, CategoryNode>;
  nodesById: Map<string, CategoryNode>;
  allNames: string[];
  totalCount: number;
  hasNew: boolean;
}

interface BuildCategoryTreeOptions {
  categories: Category[];
  posts?: Post[];
  defaultCategory?: string;
  newSince?: number;
  locale?: string;
}

export interface FlattenedCategoryNode {
  node: CategoryNode;
  depth: number;
}

const normalizePostCategory = (value: string | null | undefined, fallback: string) => {
  const normalized = normalizeCategoryName(String(value ?? '')).trim();
  return normalized || fallback;
};

export const buildCategoryTree = ({
  categories,
  posts = [],
  defaultCategory = DEFAULT_CATEGORY,
  newSince,
  locale = 'ko'
}: BuildCategoryTreeOptions): CategoryTreeResult => {
  const nodesByKey = new Map<string, CategoryNode>();
  const nodesById = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  const addNode = (entry: {
    id: string;
    name: string;
    parentId?: string | null;
    order?: number | null;
  }) => {
    const name = normalizeCategoryName(entry.name);
    if (!name) return;
    const key = normalizeCategoryKey(name);
    if (nodesByKey.has(key)) return;
    const order = Number.isFinite(entry.order) ? (entry.order as number) : Number.MAX_SAFE_INTEGER;
    const node: CategoryNode = {
      id: entry.id,
      name,
      parentId: entry.parentId ?? null,
      order,
      children: [],
      count: 0,
      directCount: 0,
      hasNew: false
    };
    nodesByKey.set(key, node);
    nodesById.set(node.id, node);
  };

  categories.forEach(category => {
    addNode(category);
  });

  if (!nodesByKey.has(normalizeCategoryKey(defaultCategory))) {
    addNode({ id: `default-${normalizeCategoryKey(defaultCategory)}`, name: defaultCategory });
  }

  posts.forEach(post => {
    const name = normalizePostCategory(post.category, defaultCategory);
    const key = normalizeCategoryKey(name);
    if (!nodesByKey.has(key)) {
      addNode({ id: `auto-${key}`, name });
    }
  });

  const defaultKey = normalizeCategoryKey(defaultCategory);
  const defaultNode = nodesByKey.get(defaultKey);

  nodesById.forEach(node => {
    const parentId = node.parentId;
    if (!parentId || parentId === node.id) {
      node.parentId = null;
      roots.push(node);
      return;
    }
    if (defaultNode && parentId === defaultNode.id) {
      node.parentId = null;
      roots.push(node);
      return;
    }
    const parent = nodesById.get(parentId);
    if (!parent) {
      node.parentId = null;
      roots.push(node);
      return;
    }
    parent.children.push(node);
  });

  posts.forEach(post => {
    const name = normalizePostCategory(post.category, defaultCategory);
    const key = normalizeCategoryKey(name);
    const node = nodesByKey.get(key);
    if (!node) return;
    node.directCount += 1;
    if (newSince) {
      const timestamp = new Date(post.publishedAt).getTime();
      if (!Number.isNaN(timestamp) && timestamp >= newSince) {
        node.hasNew = true;
      }
    }
  });

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name, locale);
    });
    nodes.forEach(node => sortNodes(node.children));
  };

  const computeCounts = (node: CategoryNode) => {
    let total = node.directCount;
    let hasNew = node.hasNew;
    node.children.forEach(child => {
      computeCounts(child);
      total += child.count;
      if (child.hasNew) hasNew = true;
    });
    node.count = total;
    node.hasNew = hasNew;
  };

  sortNodes(roots);
  roots.forEach(node => computeCounts(node));

  const allNames = sortCategories(Array.from(nodesByKey.values()).map(node => node.name));
  const hasNew = roots.some(node => node.hasNew);

  return {
    roots,
    nodesByKey,
    nodesById,
    allNames,
    totalCount: posts.length,
    hasNew
  };
};

export const flattenCategoryTree = (nodes: CategoryNode[]): FlattenedCategoryNode[] => {
  const flattened: FlattenedCategoryNode[] = [];
  const walk = (items: CategoryNode[], depth: number) => {
    items.forEach(item => {
      flattened.push({ node: item, depth });
      if (item.children.length > 0) {
        walk(item.children, depth + 1);
      }
    });
  };
  walk(nodes, 0);
  return flattened;
};
