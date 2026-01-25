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
        let sharpInstance = sharp(parsed.buffer, { animated: true }); // Enable animation support

        // Only resize if not animated (resizing animated GIFs can be expensive/tricky) or if explicitly handled
        // For simplicity, we'll skip resizing for animated images to preserve quality/speed, 
        // or we can resize but must ensure 'animated: true' is passed.
        // Let's try to resize but keep animation.

        const metadata = await sharpInstance.metadata();

        if (metadata.width > 1200) {
            sharpInstance = sharpInstance.resize({ width: 1200, withoutEnlargement: true });
        }

        const optimizedBuffer = await sharpInstance
            .webp({ quality: 80, animated: true }) // Ensure animated: true for WebP
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
