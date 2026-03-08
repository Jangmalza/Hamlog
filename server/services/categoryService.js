import { randomUUID } from 'node:crypto';
import { readCategories, writeCategories } from '../models/categoryModel.js';
import {
  detachChildCategories,
  findCategoryByIdentifier,
  isDefaultCategoryName,
  resolveCategoryUpdate,
  validateCategoryCreate,
  validateCategoryReorder
} from './category/categoryHelpers.js';
import {
  moveCategoryPostsToDefault,
  replaceCategoryInPosts
} from './category/categoryPostSync.js';

export async function createCategory(name, parentId) {
  const categories = await readCategories();
  const validation = validateCategoryCreate(categories, name, parentId);

  if (!validation.valid) {
    return { created: false, reason: validation.reason };
  }

  const newCategory = {
    id: randomUUID(),
    name: validation.normalizedName,
    parentId: validation.normalizedParentId,
    order: validation.order
  };

  const nextCategories = [...categories, newCategory];
  await writeCategories(nextCategories);

  return { categories: nextCategories, created: true, category: newCategory };
}

export async function reorderCategories(parentId, orderedIds) {
  const categories = await readCategories();
  const validation = validateCategoryReorder(categories, parentId, orderedIds);

  if (!validation.valid) {
    return { updated: false, reason: validation.reason };
  }

  const nextCategories = categories.map(category => {
    if (!validation.nextOrderMap.has(category.id)) {
      return category;
    }
    return { ...category, order: validation.nextOrderMap.get(category.id) };
  });

  const saved = await writeCategories(nextCategories);
  return { updated: true, categories: saved };
}

export async function removeCategory(categoryIdentifier) {
  const categories = await readCategories();
  const target = findCategoryByIdentifier(categories, categoryIdentifier);

  if (!target || isDefaultCategoryName(target.name)) {
    return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
  }

  const filteredCategories = categories.filter(category => category.id !== target.id);
  const { nextCategories, reparentedCount } = detachChildCategories(
    filteredCategories,
    target.id
  );
  const savedCategories = await writeCategories(nextCategories);
  const reassignedCount = await moveCategoryPostsToDefault(target.name);

  return { categories: savedCategories, reassignedCount, removed: true, reparentedCount };
}

export async function updateCategory(id, updates) {
  const categories = await readCategories();
  const resolution = resolveCategoryUpdate(categories, id, updates);

  if (!resolution.valid) {
    return { categories, updated: false, reason: resolution.reason };
  }

  const nextCategories = [...categories];
  nextCategories[resolution.targetIndex] = {
    ...resolution.target,
    name: resolution.nextName,
    parentId: resolution.nextParentId,
    order: resolution.nextOrder
  };

  const savedCategories = await writeCategories(nextCategories);
  const reassignedCount = resolution.nameChanged
    ? await replaceCategoryInPosts(resolution.target.name, resolution.nextName)
    : 0;

  return {
    categories: savedCategories,
    updated: true,
    reassignedCount,
    previousName: resolution.target.name,
    nextName: resolution.nextName
  };
}
