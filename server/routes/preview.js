import express from 'express';
import { getPreview } from '../controllers/previewController.js';
import { previewRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/preview', previewRateLimiter, getPreview); // /api/preview?url=...

export const previewRouter = router;
