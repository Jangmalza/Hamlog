import { requestJson } from './client';

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

export async function uploadLocalImage(file: File): Promise<UploadResponse> {
  const dataUrl = await fileToDataUrl(file);
  return requestJson<UploadResponse>('/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dataUrl,
      filename: file.name
    })
  });
}
