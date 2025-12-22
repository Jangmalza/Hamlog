import type { Category } from '../types/category';
import { requestJson } from './client';

interface CategoryListResponse {
  categories: Category[];
  total: number;
}

interface CategoryMutationResponse {
  categories: Category[];
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await requestJson<CategoryListResponse>('/categories');
  return data.categories;
}

export async function createCategory(name: string, parentId?: string | null): Promise<Category[]> {
  const data = await requestJson<CategoryMutationResponse>('/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, parentId: parentId || null })
  });
  return data.categories;
}

export async function deleteCategory(id: string): Promise<Category[]> {
  const data = await requestJson<CategoryMutationResponse>(
    `/categories/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    }
  );
  return data.categories;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; parentId?: string | null }
): Promise<Category[]> {
  const data = await requestJson<CategoryMutationResponse>(
    `/categories/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  return data.categories;
}

export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[]
): Promise<Category[]> {
  const data = await requestJson<CategoryMutationResponse>('/categories/reorder', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parentId: parentId || null, orderedIds })
  });
  return data.categories;
}
