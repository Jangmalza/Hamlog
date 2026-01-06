import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { uploadDir } from '../config/paths.js';
import { parseDataUrl, allowedImageTypes } from '../utils/normalizers.js';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function processImageUpload(dataUrl) {
    const parsed = parseDataUrl(dataUrl);

    if (!parsed) {
        return { success: false, error: '이미지 데이터가 올바르지 않습니다.', code: 'invalid_data' };
    }

    const extension = allowedImageTypes.get(parsed.mime);
    if (!extension) {
        return { success: false, error: '지원하지 않는 이미지 형식입니다.', code: 'invalid_type' };
    }

    if (!parsed.buffer.length) {
        return { success: false, error: '빈 파일은 업로드할 수 없습니다.', code: 'empty_file' };
    }

    if (parsed.buffer.length > MAX_UPLOAD_BYTES) {
        return { success: false, error: '이미지 용량이 너무 큽니다.', code: 'too_large' };
    }

    try {
        await mkdir(uploadDir, { recursive: true });

        // Image Optimization
        const filename = `upload-${Date.now()}-${randomUUID()}.webp`;
        const optimizedBuffer = await sharp(parsed.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // Limit width to 1200px
            .webp({ quality: 80 }) // Convert to WebP with 80% quality
            .toBuffer();

        await writeFile(path.join(uploadDir, filename), optimizedBuffer);

        return {
            success: true,
            data: {
                url: `/uploads/${filename}`,
                filename
            }
        };
    } catch (error) {
        console.error('Image processing error:', error);
        return { success: false, error: '이미지 처리 중 오류가 발생했습니다.', code: 'processing_error' };
    }
}
