import express from 'express';
import { randomUUID } from 'crypto';

export const createUploadRouter = ({
  parseDataUrl,
  allowedImageTypes,
  MAX_UPLOAD_BYTES,
  ensureUploadDir,
  writeFile,
  path,
  uploadDir
}) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
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

      await ensureUploadDir();
      const filename = `upload-${Date.now()}-${randomUUID()}.${extension}`;
      await writeFile(path.join(uploadDir, filename), parsed.buffer);

      res.status(201).json({
        url: `/uploads/${filename}`,
        filename
      });
    } catch (error) {
      console.error('Failed to upload image', error);
      res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }
  });

  return router;
};
