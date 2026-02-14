import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';

import { authenticateToken } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', uploadRateLimiter, authenticateToken, uploadImage);

export const uploadRouter = router;
