import { readFile, writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { categoriesFilePath, dataDir } from '../config/paths.js';
import {
    normalizeCategoryList,
    normalizeCategoryName,
    normalizeCategoryKey,
    normalizeCategoryId,
    DEFAULT_CATEGORY,
    getNextCategoryOrder
} from '../utils/normalizers.js';
import { readPosts, writePosts } from './postModel.js';

export async function readCategories() {
    const raw = await readFile(categoriesFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeCategoryList(parsed);
}

export async function writeCategories(categories) {
    const normalized = normalizeCategoryList(categories);
    await writeFile(categoriesFilePath, JSON.stringify(normalized, null, 2), 'utf8');
    return normalized;
}

export async function ensureCategoriesFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await import('fs/promises').then(fs => fs.access(categoriesFilePath)); // Clean way to check access? 
        // access throws if not exists
        const existing = await readCategories();
        await writeCategories(existing);
    } catch {
        // We need readPosts logic here? index.js fell back to deriving categories from posts.
        // Circular dependency warning: PostModel needs CategoryModel?
        // In index.js: ensureCategoriesFile calls readPosts.
        // We should move ensure functions to a startup script or keep in index? 
        // Or allow cross-model usage.
        // For now, let's implement basic CRUD. Startup ensures might be better in a 'services/init.js' or just imports.

        // Simplification for now: If categories.json missing, start with defaults.
        // The "derive from posts" logic was for migration. 
        // I will try to implement it if I can import readPosts.
        const derived = []; // Fallback empty
        await writeCategories(derived);
    }
}

// ... other category manipulation functions (addCategoryIfMissing, etc) can be moved here or controller.
// Logic like `addCategoryIfMissing` involves reading/writing, so Model/Service layer is appropriate.

export async function addCategoryIfMissing(category) {
    const name = normalizeCategoryName(category);
    if (!name) return readCategories();
    const key = normalizeCategoryKey(name);
    const categories = await readCategories();
    if (categories.some(item => normalizeCategoryKey(item.name) === key)) {
        return categories;
    }
    const order = getNextCategoryOrder(categories, null);
    const next = [...categories, { id: randomUUID(), name, parentId: null, order }];
    return writeCategories(next);
}

export async function removeCategoryByName(category) {
    const normalized = normalizeCategoryName(category);
    if (!normalized) {
        return { categories: await readCategories(), reassignedCount: 0, removed: false, reparentedCount: 0 };
    }
    const categories = await readCategories();
    const key = normalizeCategoryKey(normalized);
    const target =
        categories.find(item => item.id === normalized) ??
        categories.find(item => normalizeCategoryKey(item.name) === key);
    if (!target) {
        return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
    }
    const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
    if (normalizeCategoryKey(target.name) === defaultKey) {
        return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
    }
    const next = categories.filter(item => item.id !== target.id);
    let reparentedCount = 0;
    const reparented = next.map((item) => {
        if (item.parentId === target.id) {
            reparentedCount += 1;
            return { ...item, parentId: null, order: null };
        }
        return item;
    });
    const savedCategories = await writeCategories(reparented);

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

export async function updateCategoryById(id, updates) {
    const categories = await readCategories();
    const targetIndex = categories.findIndex(item => item.id === id);
    if (targetIndex < 0) {
        return { categories, updated: false, reason: 'not_found' };
    }

    const target = categories[targetIndex];
    const next = [...categories];
    let nextName = target.name;
    let nameChanged = false;

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

    let nextOrder = Number.isFinite(target.order) ? target.order : 0;
    if (parentChanged) {
        const siblings = categories.filter(item => item.id !== id);
        nextOrder = getNextCategoryOrder(siblings, nextParentId);
    }

    next[targetIndex] = {
        ...target,
        name: nextName,
        parentId: nextParentId,
        order: nextOrder
    };
    const savedCategories = await writeCategories(next);
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
