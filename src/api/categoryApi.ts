const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface CategoryListResponse {
  categories: string[];
  total: number;
}

interface CategoryMutationResponse {
  categories: string[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || `Request failed with status ${response.status}`);
    }
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  const data = await handleResponse<CategoryListResponse>(response);
  return data.categories;
}

export async function createCategory(name: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  const data = await handleResponse<CategoryMutationResponse>(response);
  return data.categories;
}

export async function deleteCategory(name: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });
  const data = await handleResponse<CategoryMutationResponse>(response);
  return data.categories;
}
