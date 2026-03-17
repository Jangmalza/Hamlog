export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { message?: string };
    return payload.message;
  }
  return response.text();
};

const handleError = async (response: Response) => {
  const message = await readErrorMessage(response);
  throw new ApiError(response.status, message || `Request failed with status ${response.status}`);
};

export const isAuthenticationError = (error: unknown) => (
  error instanceof ApiError && (error.status === 401 || error.status === 403)
);

export const requestJson = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' });
  if (!response.ok) {
    await handleError(response);
  }
  return response.json() as Promise<T>;
};

export const requestVoid = async (path: string, options?: RequestInit): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' });
  if (response.status === 204) return;
  if (!response.ok) {
    await handleError(response);
    return;
  }
};
