import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProfile);
router.put('/', authenticateToken, updateProfile);

export const profileRouter = router;
