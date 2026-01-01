import { randomUUID } from 'node:crypto';
import { readCategories, writeCategories } from '../models/categoryModel.js';
import { readPosts, writePosts } from '../models/postModel.js';
import {
    normalizeCategoryName,
    normalizeCategoryKey,
    normalizeCategoryId,
    DEFAULT_CATEGORY,
    getNextCategoryOrder
} from '../utils/normalizers.js';

/**
 * Add a category if it doesn't exist.
 * Used mainly for initialization or simple addition.
 */
export async function addCategoryIfMissing(categoryName) {
    const name = normalizeCategoryName(categoryName);
    if (!name) return readCategories();

    const key = normalizeCategoryKey(name);
    const categories = await readCategories();

    if (categories.some(item => normalizeCategoryKey(item.name) === key)) {
        return categories;
    }

    const order = getNextCategoryOrder(categories, null);
    const newItem = { id: randomUUID(), name, parentId: null, order };
    const nextCategories = [...categories, newItem];

    return writeCategories(nextCategories);
}

/**
 * Remove a category by its ID (preferred) or Name (legacy support).
 * Also handles re-parenting children and re-assigning posts to default.
 */
export async function removeCategory(categoryIdentifier) {
    // Determine if identifier is ID or Name. 
    // Logic from original model mixed both, strictly speaking we should use ID.
    // For compatibility with original logic which took "category" (often name):

    // Original logic: normalized = normalizeCategoryName(category) -> checks if matches ID OR Name
    const categories = await readCategories();

    // Try to find by ID first
    let target = categories.find(item => item.id === categoryIdentifier);

    // If not found, try by name (legacy behavior support)
    if (!target) {
        const normalizedName = normalizeCategoryName(categoryIdentifier);
        if (normalizedName) {
            const key = normalizeCategoryKey(normalizedName);
            target = categories.find(item => normalizeCategoryKey(item.name) === key);
        }
    }

    if (!target) {
        return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
    }

    const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
    if (normalizeCategoryKey(target.name) === defaultKey) {
        // Cannot delete default category
        return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
    }

    const nextCategories = categories.filter(item => item.id !== target.id);

    // Re-parent children
    let reparentedCount = 0;
    const reparentedCategories = nextCategories.map((item) => {
        if (item.parentId === target.id) {
            reparentedCount += 1;
            return { ...item, parentId: null, order: null };
        }
        return item;
    });

    const savedCategories = await writeCategories(reparentedCategories);

    // Update Posts
    const posts = await readPosts();
    let reassignedCount = 0;
    const updatedPosts = posts.map((post) => {
        if (normalizeCategoryKey(post.category) === normalizeCategoryKey(target.name)) {
            reassignedCount += 1;
            return { ...post, category: DEFAULT_CATEGORY };
        }
        return post;
    });

    if (reassignedCount > 0) {
        await writePosts(updatedPosts);
    }

    return { categories: savedCategories, reassignedCount, removed: true, reparentedCount };
}

/**
 * Update a category's name or parent.
 * Handles validation, duplication check, cycle detection, and post updates.
 */
export async function updateCategory(id, updates) {
    const categories = await readCategories();
    const targetIndex = categories.findIndex(item => item.id === id);
    if (targetIndex < 0) {
        return { categories, updated: false, reason: 'not_found' };
    }

    const target = categories[targetIndex];
    const nextCategories = [...categories];
    let nextName = target.name;
    let nameChanged = false;

    // 1. Handle Name Change
    if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
        const normalized = normalizeCategoryName(updates.name);
        if (!normalized) {
            return { categories, updated: false, reason: 'name_required' };
        }
        if (normalizeCategoryKey(normalized) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
            return { categories, updated: false, reason: 'default' };
        }

        const duplicate = categories.some(
            item =>
                item.id !== id &&
                normalizeCategoryKey(item.name) === normalizeCategoryKey(normalized)
        );
        if (duplicate) {
            return { categories, updated: false, reason: 'duplicate' };
        }

        nameChanged = normalizeCategoryKey(normalized) !== normalizeCategoryKey(target.name);
        nextName = normalized;
    }

    // 2. Handle Parent Change (Cycle Detection)
    let nextParentId = target.parentId ?? null;
    let parentChanged = false;

    if (Object.prototype.hasOwnProperty.call(updates, 'parentId')) {
        const normalizedParentId = normalizeCategoryId(updates.parentId);

        if (!normalizedParentId) {
            nextParentId = null;
        } else {
            if (normalizedParentId === id) {
                return { categories, updated: false, reason: 'self_parent' };
            }

            const parent = categories.find(item => item.id === normalizedParentId);
            if (!parent) {
                return { categories, updated: false, reason: 'parent_not_found' };
            }
            if (normalizeCategoryKey(parent.name) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
                return { categories, updated: false, reason: 'parent_default' };
            }

            // Cycle detection
            let cursor = normalizedParentId;
            while (cursor) {
                if (cursor === id) {
                    return { categories, updated: false, reason: 'cycle' };
                }
                const current = categories.find(item => item.id === cursor);
                cursor = current?.parentId ? String(current.parentId) : '';
            }
            nextParentId = normalizedParentId;
        }
        parentChanged = nextParentId !== (target.parentId ?? null);
    }

    // 3. Handle Order
    let nextOrder = Number.isFinite(target.order) ? target.order : 0;
    if (parentChanged) {
        const siblings = categories.filter(item => item.id !== id);
        nextOrder = getNextCategoryOrder(siblings, nextParentId);
    }

    // Apply updates
    nextCategories[targetIndex] = {
        ...target,
        name: nextName,
        parentId: nextParentId,
        order: nextOrder
    };

    const savedCategories = await writeCategories(nextCategories);

    // 4. Update Posts if name changed
    let reassignedCount = 0;
    if (nameChanged) {
        const posts = await readPosts();
        const updatedPosts = posts.map((post) => {
            if (normalizeCategoryKey(post.category) === normalizeCategoryKey(target.name)) {
                reassignedCount += 1;
                return { ...post, category: nextName };
            }
            return post;
        });

        if (reassignedCount > 0) {
            await writePosts(updatedPosts);
        }
    }

    return {
        categories: savedCategories,
        updated: true,
        reassignedCount,
        previousName: target.name,
        nextName
    };
}
