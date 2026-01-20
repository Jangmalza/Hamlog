import express from 'express';
import { getPreview } from '../controllers/previewController.js';

const router = express.Router();

router.get('/preview', getPreview); // /api/preview?url=...

export const previewRouter = router;
