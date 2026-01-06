import { processImageUpload } from '../services/uploadService.js';

export const uploadImage = async (req, res) => {
    try {
        const { dataUrl } = req.body ?? {};

        const result = await processImageUpload(dataUrl);

        if (!result.success) {
            const status = result.code === 'too_large' ? 413 : 400;
            return res.status(status).json({ message: result.error });
        }

        res.status(201).json(result.data);
    } catch (error) {
        console.error('Failed to upload image', error);
        res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }
};
