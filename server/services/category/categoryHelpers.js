import {
  DEFAULT_CATEGORY,
  getNextCategoryOrder,
  normalizeCategoryId,
  normalizeCategoryKey,
  normalizeCategoryName
} from '../../utils/normalizers/categoryNormalizers.js';

export function isDefaultCategoryName(name) {
  return normalizeCategoryKey(name) === normalizeCategoryKey(DEFAULT_CATEGORY);
}

export function findCategoryByIdentifier(categories, identifier) {
  const byId = categories.find(category => category.id === identifier);
  if (byId) {
    return byId;
  }

  const normalizedName = normalizeCategoryName(identifier);
  if (!normalizedName) {
    return null;
  }

  const key = normalizeCategoryKey(normalizedName);
  return categories.find(category => normalizeCategoryKey(category.name) === key) ?? null;
}

export function validateCategoryCreate(categories, name, parentId) {
  const normalizedName = normalizeCategoryName(name);
  if (!normalizedName) {
    return { valid: false, reason: 'name_required' };
  }

  if (isDefaultCategoryName(normalizedName)) {
    return { valid: false, reason: 'duplicate' };
  }

  const duplicate = categories.some(
    category => normalizeCategoryKey(category.name) === normalizeCategoryKey(normalizedName)
  );
  if (duplicate) {
    return { valid: false, reason: 'duplicate' };
  }

  const normalizedParentId = normalizeCategoryId(parentId);
  if (normalizedParentId) {
    const parent = categories.find(category => category.id === normalizedParentId);
    if (!parent) {
      return { valid: false, reason: 'parent_not_found' };
    }
    if (isDefaultCategoryName(parent.name)) {
      return { valid: false, reason: 'parent_default' };
    }
  }

  return {
    valid: true,
    normalizedName,
    normalizedParentId: normalizedParentId || null,
    order: getNextCategoryOrder(categories, normalizedParentId || null)
  };
}

export function validateCategoryReorder(categories, parentId, orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { valid: false, reason: 'invalid_list' };
  }

  const normalizedParentId = normalizeCategoryId(parentId);
  const targetParentId = normalizedParentId || null;
  const cleanedIds = orderedIds.map(item => normalizeCategoryId(item));

  if (cleanedIds.some(id => !id)) {
    return { valid: false, reason: 'invalid_id' };
  }

  if (targetParentId && !categories.some(category => category.id === targetParentId)) {
    return { valid: false, reason: 'parent_not_found' };
  }

  const siblings = categories.filter(category => (category.parentId ?? null) === targetParentId);
  if (siblings.length === 0) {
    return { valid: false, reason: 'no_siblings' };
  }
  if (cleanedIds.length !== siblings.length) {
    return { valid: false, reason: 'list_mismatch' };
  }

  const siblingIds = new Set(siblings.map(category => category.id));
  const nextOrderMap = new Map();

  for (let index = 0; index < cleanedIds.length; index += 1) {
    const id = cleanedIds[index];
    if (!siblingIds.has(id)) {
      return { valid: false, reason: 'invalid_list_content' };
    }
    if (nextOrderMap.has(id)) {
      return { valid: false, reason: 'duplicate_in_list' };
    }
    nextOrderMap.set(id, index);
  }

  return { valid: true, nextOrderMap };
}

function willCreateCycle(categories, targetId, nextParentId) {
  let cursor = nextParentId;
  while (cursor) {
    if (cursor === targetId) {
      return true;
    }
    const current = categories.find(category => category.id === cursor);
    cursor = current?.parentId ? String(current.parentId) : '';
  }
  return false;
}

export function resolveCategoryUpdate(categories, id, updates) {
  const targetIndex = categories.findIndex(category => category.id === id);
  if (targetIndex < 0) {
    return { valid: false, reason: 'not_found' };
  }

  const target = categories[targetIndex];
  const nextName =
    Object.prototype.hasOwnProperty.call(updates, 'name')
      ? normalizeCategoryName(updates.name)
      : target.name;

  if (!nextName) {
    return { valid: false, reason: 'name_required' };
  }
  if (isDefaultCategoryName(nextName)) {
    return { valid: false, reason: 'default' };
  }

  const duplicate = categories.some(
    category =>
      category.id !== id && normalizeCategoryKey(category.name) === normalizeCategoryKey(nextName)
  );
  if (duplicate) {
    return { valid: false, reason: 'duplicate' };
  }

  const nameChanged = normalizeCategoryKey(nextName) !== normalizeCategoryKey(target.name);

  let nextParentId = target.parentId ?? null;
  let parentChanged = false;

  if (Object.prototype.hasOwnProperty.call(updates, 'parentId')) {
    const normalizedParentId = normalizeCategoryId(updates.parentId);

    if (!normalizedParentId) {
      nextParentId = null;
    } else {
      if (normalizedParentId === id) {
        return { valid: false, reason: 'self_parent' };
      }

      const parent = categories.find(category => category.id === normalizedParentId);
      if (!parent) {
        return { valid: false, reason: 'parent_not_found' };
      }
      if (isDefaultCategoryName(parent.name)) {
        return { valid: false, reason: 'parent_default' };
      }
      if (willCreateCycle(categories, id, normalizedParentId)) {
        return { valid: false, reason: 'cycle' };
      }

      nextParentId = normalizedParentId;
    }

    parentChanged = nextParentId !== (target.parentId ?? null);
  }

  const siblingSource = categories.filter(category => category.id !== id);
  const nextOrder = parentChanged
    ? getNextCategoryOrder(siblingSource, nextParentId)
    : Number.isFinite(target.order)
      ? target.order
      : 0;

  return {
    valid: true,
    target,
    targetIndex,
    nextName,
    nextParentId,
    nextOrder,
    nameChanged
  };
}

export function detachChildCategories(categories, removedId) {
  let reparentedCount = 0;
  const nextCategories = categories.map(category => {
    if (category.parentId === removedId) {
      reparentedCount += 1;
      return { ...category, parentId: null, order: null };
    }
    return category;
  });

  return { nextCategories, reparentedCount };
}
