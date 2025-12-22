import { useCallback, useState } from 'react';
import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  fetchCategories as fetchCategoriesRequest
} from '../api/categoryApi';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchCategoriesRequest();
      setCategories(list);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '카테고리를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string) => {
    if (saving) return [];
    setSaving(true);
    setError('');
    try {
      const next = await createCategoryRequest(name);
      setCategories(next);
      return next;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '카테고리 추가에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const removeCategory = useCallback(async (name: string) => {
    if (saving) return [];
    setSaving(true);
    setError('');
    try {
      const next = await deleteCategoryRequest(name);
      setCategories(next);
      return next;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '카테고리 삭제에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [saving]);

  return {
    categories,
    loading,
    saving,
    error,
    setError,
    loadCategories,
    addCategory,
    removeCategory
  };
};
