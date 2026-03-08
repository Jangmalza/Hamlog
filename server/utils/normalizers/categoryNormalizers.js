import { randomUUID } from 'crypto';

export const DEFAULT_CATEGORY = '미분류';

export function normalizeCategoryName(value) {
    return value !== undefined && value !== null ? String(value).trim() : '';
}

export function normalizeCategory(category) {
    const normalized = normalizeCategoryName(category);
    return normalized || DEFAULT_CATEGORY;
}

export function normalizeCategoryId(value) {
    const normalized = normalizeCategoryName(value);
    return normalized || '';
}

export function normalizeCategoryOrder(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < 0) return null;
    return Math.floor(parsed);
}

export function normalizeCategoryKey(category) {
    return normalizeCategory(category).toLowerCase();
}

export function normalizeCategoryList(categories) {
    const list = Array.isArray(categories) ? categories : [];
    const categoryMap = new Map();
    const idMap = new Map();
    const normalizedList = [];
    const sourceIndexById = new Map();

    list.forEach((item) => {
        if (typeof item === 'string') {
            const name = normalizeCategoryName(item);
            if (!name) return;
            const key = normalizeCategoryKey(name);
            if (categoryMap.has(key)) return;
            let id = randomUUID();
            if (idMap.has(id)) {
                id = randomUUID();
            }
            const next = { id, name, parentId: null, order: null };
            categoryMap.set(key, next);
            idMap.set(id, next);
            normalizedList.push(next);
            sourceIndexById.set(id, normalizedList.length - 1);
            return;
        }

        if (!item || typeof item !== 'object') return;
        const name = normalizeCategoryName(item.name);
        if (!name) return;
        const key = normalizeCategoryKey(name);
        if (categoryMap.has(key)) return;

        let id = normalizeCategoryId(item.id);
        if (!id || idMap.has(id)) {
            id = randomUUID();
        }

        const parentId = normalizeCategoryId(item.parentId);
        const order = normalizeCategoryOrder(item.order);
        const next = { id, name, parentId: parentId || null, order };
        categoryMap.set(key, next);
        idMap.set(id, next);
        normalizedList.push(next);
        sourceIndexById.set(id, normalizedList.length - 1);
    });

    const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
    if (!categoryMap.has(defaultKey)) {
        const id = randomUUID();
        const next = { id, name: DEFAULT_CATEGORY, parentId: null, order: null };
        categoryMap.set(defaultKey, next);
        idMap.set(id, next);
        normalizedList.push(next);
        sourceIndexById.set(id, normalizedList.length - 1);
    }

    const defaultEntry = categoryMap.get(defaultKey);
    normalizedList.forEach((item) => {
        const parentId = normalizeCategoryId(item.parentId);
        if (!parentId || parentId === item.id || !idMap.has(parentId)) {
            item.parentId = null;
            return;
        }
        if (defaultEntry && parentId === defaultEntry.id) {
            item.parentId = null;
            return;
        }

        let cursor = parentId;
        const visited = new Set([item.id]);
        while (cursor) {
            if (visited.has(cursor)) {
                item.parentId = null;
                return;
            }
            visited.add(cursor);
            const parent = idMap.get(cursor);
            cursor = parent?.parentId ? String(parent.parentId) : '';
        }

        item.parentId = parentId;
    });

    const groups = new Map();
    normalizedList.forEach((item) => {
        const key = item.parentId ?? '__root__';
        const group = groups.get(key);
        if (group) {
            group.push(item);
        } else {
            groups.set(key, [item]);
        }
    });

    groups.forEach((items) => {
        const sorted = [...items].sort((a, b) => {
            const orderA = Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
            const orderB = Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
            if (orderA !== orderB) return orderA - orderB;
            const indexA = sourceIndexById.get(a.id) ?? 0;
            const indexB = sourceIndexById.get(b.id) ?? 0;
            return indexA - indexB;
        });

        sorted.forEach((item, index) => {
            item.order = index;
        });
    });

    return normalizedList;
}

export function getNextCategoryOrder(categories, parentId) {
    const normalizedParentId = parentId ?? null;
    let maxOrder = -1;

    categories.forEach((item) => {
        const currentParent = item.parentId ?? null;
        if (currentParent !== normalizedParentId) return;
        const order = Number.isFinite(item.order) ? item.order : -1;
        if (order > maxOrder) {
            maxOrder = order;
        }
    });

    return maxOrder + 1;
}
