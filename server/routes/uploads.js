import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, uploadImage);

export const uploadRouter = router;
