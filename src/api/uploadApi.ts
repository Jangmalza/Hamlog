const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface UploadResponse {
  url: string;
  filename: string;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

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

export async function uploadLocalImage(file: File): Promise<UploadResponse> {
  const dataUrl = await fileToDataUrl(file);
  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dataUrl,
      filename: file.name
    })
  });

  return handleResponse<UploadResponse>(response);
}
