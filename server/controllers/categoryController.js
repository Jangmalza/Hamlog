import {
    readCategories
} from '../models/categoryModel.js';
import {
    createCategory,
    removeCategory,
    updateCategory,
    reorderCategories as reorderCategoriesService
} from '../services/categoryService.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await readCategories();
        res.json({ categories, total: categories.length });
    } catch (error) {
        console.error('Failed to fetch categories', error);
        res.status(500).json({ message: '카테고리를 불러오지 못했습니다.' });
    }
};

export const createCategoryController = async (req, res) => {
    try {
        const { name, parentId } = req.body ?? {};

        const result = await createCategory(name, parentId);

        if (!result.created) {
            switch (result.reason) {
                case 'name_required':
                    return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
                case 'duplicate':
                    return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
                case 'parent_not_found':
                    return res.status(400).json({ message: '상위 카테고리를 찾을 수 없습니다.' });
                case 'parent_default':
                    return res.status(400).json({ message: '기본 카테고리는 상위로 지정할 수 없습니다.' });
                default:
                    return res.status(400).json({ message: '카테고리 생성에 실패했습니다.' });
            }
        }

        res.status(201).json({ categories: result.categories });
    } catch (error) {
        console.error('Failed to create category', error);
        res.status(500).json({ message: '카테고리 생성에 실패했습니다.' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { name } = req.params;
        // Logic moved to service, which supports ID or Name
        const result = await removeCategory(name);

        if (!result.removed) {
            // If not removed, it might be not found or default
            // The service currently returns { removed: false } for both "not found" and "default".
            // We can infer or check explicitly if needed, but for now generic error 400 or 404.
            // Looking at service: it returns removed: false if target not found OR if target is default.
            // We can assume user tried to delete default or invalid category.
            return res.status(400).json({ message: '카테고리를 삭제할 수 없습니다. (기본 카테고리거나 존재하지 않음)' });
        }

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
        const result = await reorderCategoriesService(parentId, orderedIds);

        if (!result.updated) {
            return res.status(400).json({ message: '카테고리 순서 변경 실패: ' + result.reason });
        }

        return res.json({ categories: result.categories });
    } catch (error) {
        console.error('Failed to reorder categories', error);
        return res.status(500).json({ message: '카테고리 순서 변경에 실패했습니다.' });
    }
};

export const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId } = req.body ?? {};

        // Filter updates
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (parentId !== undefined) updates.parentId = parentId;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: '업데이트할 값이 없습니다.' });
        }

        const result = await updateCategory(id, updates);

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
                    return res.status(400).json({ message: '카테고리 수정에 실패했습니다.' });
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

// Map exported names to match routes if necessary
export { createCategoryController as createCategory, updateCategoryController as updateCategory };
