import { randomUUID } from 'crypto';
import {
    readCategories,
    writeCategories,
    removeCategoryByName,
    updateCategoryById
} from '../models/categoryModel.js';
import {
    normalizeCategoryName,
    normalizeCategoryKey,
    normalizeCategoryId,
    getNextCategoryOrder,
    DEFAULT_CATEGORY
} from '../utils/normalizers.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await readCategories();
        res.json({ categories, total: categories.length });
    } catch (error) {
        console.error('Failed to fetch categories', error);
        res.status(500).json({ message: '카테고리를 불러오지 못했습니다.' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, parentId } = req.body ?? {};
        const normalized = normalizeCategoryName(name);
        if (!normalized) {
            return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
        }
        if (normalizeCategoryKey(normalized) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
            return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
        }
        const categories = await readCategories();
        const exists = categories.some(
            category => normalizeCategoryKey(category.name) === normalizeCategoryKey(normalized)
        );
        if (exists) {
            return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
        }
        const normalizedParentId = normalizeCategoryId(parentId);
        if (normalizedParentId) {
            const parent = categories.find(category => category.id === normalizedParentId);
            if (!parent) {
                return res.status(400).json({ message: '상위 카테고리를 찾을 수 없습니다.' });
            }
            if (normalizeCategoryKey(parent.name) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
                return res.status(400).json({ message: '기본 카테고리는 상위로 지정할 수 없습니다.' });
            }
        }
        const order = getNextCategoryOrder(categories, normalizedParentId || null);
        const next = await writeCategories([
            ...categories,
            {
                id: randomUUID(),
                name: normalized,
                parentId: normalizedParentId || null,
                order
            }
        ]);
        res.status(201).json({ categories: next });
    } catch (error) {
        console.error('Failed to create category', error);
        res.status(500).json({ message: '카테고리 생성에 실패했습니다.' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { name } = req.params;
        const normalized = normalizeCategoryName(name);
        if (!normalized) {
            return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
        }
        const categories = await readCategories();
        const key = normalizeCategoryKey(normalized);
        const target =
            categories.find(category => category.id === normalized) ??
            categories.find(category => normalizeCategoryKey(category.name) === key);
        if (!target) {
            return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
        }
        if (normalizeCategoryKey(target.name) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
            return res.status(400).json({ message: '기본 카테고리는 삭제할 수 없습니다.' });
        }
        const result = await removeCategoryByName(target.id);
        res.json({
            categories: result.categories,
            reassignedCount: result.reassignedCount,
            reparentedCount: result.reparentedCount
        });
    } catch (error) {
        console.error('Failed to delete category', error);
        res.status(500).json({ message: '카테고리 삭제에 실패했습니다.' });
    }
};

export const reorderCategories = async (req, res) => {
    try {
        const { parentId, orderedIds } = req.body ?? {};
        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return res.status(400).json({ message: '정렬할 카테고리 목록이 필요합니다.' });
        }
        const normalizedParentId = normalizeCategoryId(parentId);
        const targetParentId = normalizedParentId || null;
        const cleanedIds = orderedIds.map(item => normalizeCategoryId(item));
        if (cleanedIds.some(id => !id)) {
            return res
                .status(400)
                .json({ message: '유효하지 않은 카테고리 ID가 포함되어 있습니다.' });
        }
        const categories = await readCategories();
        if (targetParentId && !categories.some(category => category.id === targetParentId)) {
            return res.status(404).json({ message: '상위 카테고리를 찾을 수 없습니다.' });
        }
        const siblings = categories.filter(
            category => (category.parentId ?? null) === targetParentId
        );
        if (siblings.length === 0) {
            return res.status(400).json({ message: '정렬할 카테고리가 없습니다.' });
        }
        if (cleanedIds.length !== siblings.length) {
            return res.status(400).json({ message: '정렬할 카테고리 목록이 일치하지 않습니다.' });
        }
        const siblingIds = new Set(siblings.map(item => item.id));
        const nextOrderMap = new Map();
        for (let index = 0; index < cleanedIds.length; index += 1) {
            const id = cleanedIds[index];
            if (!siblingIds.has(id)) {
                return res
                    .status(400)
                    .json({ message: '정렬할 카테고리 목록이 올바르지 않습니다.' });
            }
            if (nextOrderMap.has(id)) {
                return res
                    .status(400)
                    .json({ message: '정렬할 카테고리가 중복되었습니다.' });
            }
            nextOrderMap.set(id, index);
        }
        if (nextOrderMap.size !== siblings.length) {
            return res.status(400).json({ message: '정렬할 카테고리 목록이 올바르지 않습니다.' });
        }
        const next = categories.map(category => {
            if (!nextOrderMap.has(category.id)) return category;
            return { ...category, order: nextOrderMap.get(category.id) };
        });
        const saved = await writeCategories(next);
        return res.json({ categories: saved });
    } catch (error) {
        console.error('Failed to reorder categories', error);
        return res.status(500).json({ message: '카테고리 순서 변경에 실패했습니다.' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const normalizedId = normalizeCategoryId(id);
        if (!normalizedId) {
            return res.status(400).json({ message: '카테고리 ID가 필요합니다.' });
        }
        const { name, parentId } = req.body ?? {};
        const updates = {};
        if (name !== undefined) {
            updates.name = name;
        }
        if (parentId !== undefined) {
            updates.parentId = parentId;
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: '업데이트할 값이 없습니다.' });
        }
        const result = await updateCategoryById(normalizedId, updates);
        if (!result.updated) {
            switch (result.reason) {
                case 'not_found':
                    return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
                case 'name_required':
                    return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
                case 'default':
                    return res.status(400).json({ message: '기본 카테고리는 사용할 수 없습니다.' });
                case 'duplicate':
                    return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
                case 'parent_not_found':
                    return res.status(400).json({ message: '상위 카테고리를 찾을 수 없습니다.' });
                case 'parent_default':
                    return res.status(400).json({ message: '기본 카테고리는 상위로 지정할 수 없습니다.' });
                case 'self_parent':
                case 'cycle':
                    return res.status(400).json({ message: '상위 카테고리를 다시 선택하세요.' });
                default:
                    return res.status(400).json({ message: '카테고리 업데이트에 실패했습니다.' });
            }
        }
        return res.json({
            categories: result.categories,
            reassignedCount: result.reassignedCount,
            previousName: result.previousName,
            nextName: result.nextName
        });
    } catch (error) {
        console.error('Failed to update category', error);
        res.status(500).json({ message: '카테고리 수정에 실패했습니다.' });
    }
};
