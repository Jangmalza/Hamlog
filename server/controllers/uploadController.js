import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { uploadDir } from '../config/paths.js';
import { parseDataUrl, allowedImageTypes } from '../utils/normalizers.js';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const uploadImage = async (req, res) => {
    try {
        const { dataUrl } = req.body ?? {};
        const parsed = parseDataUrl(dataUrl);

        if (!parsed) {
            return res.status(400).json({ message: '이미지 데이터가 올바르지 않습니다.' });
        }

        const extension = allowedImageTypes.get(parsed.mime);
        if (!extension) {
            return res.status(400).json({ message: '지원하지 않는 이미지 형식입니다.' });
        }

        if (!parsed.buffer.length) {
            return res.status(400).json({ message: '빈 파일은 업로드할 수 없습니다.' });
        }

        if (parsed.buffer.length > MAX_UPLOAD_BYTES) {
            return res.status(413).json({ message: '이미지 용량이 너무 큽니다.' });
        }

        await mkdir(uploadDir, { recursive: true });

        // Image Optimization
        const filename = `upload-${Date.now()}-${randomUUID()}.webp`;
        const optimizedBuffer = await sharp(parsed.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // Limit width to 1200px
            .webp({ quality: 80 }) // Convert to WebP with 80% quality
            .toBuffer();

        await writeFile(path.join(uploadDir, filename), optimizedBuffer);

        res.status(201).json({
            url: `/uploads/${filename}`,
            filename
        });
    } catch (error) {
        console.error('Failed to upload image', error);
        res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }
};
