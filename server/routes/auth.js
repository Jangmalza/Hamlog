import express from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

export const authRouter = router;
