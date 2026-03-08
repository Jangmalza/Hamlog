import type { CategoryNode } from '../../../utils/categoryTree';

export const getDescendantIds = (root: CategoryNode) => {
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

export const findCategoryParent = (
  id: string,
  nodes: CategoryNode[],
  parentId: string | null = null
): { parentId: string | null; siblings: CategoryNode[] } | null => {
  for (const node of nodes) {
    if (node.id === id) return { parentId, siblings: nodes };
    if (node.children.length > 0) {
      const result = findCategoryParent(id, node.children, node.id);
      if (result) return result;
    }
  }

  return null;
};
