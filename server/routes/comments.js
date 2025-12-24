import express from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getComments);
router.post('/', createComment); // Public
router.delete('/:id', authenticateToken, deleteComment); // Admin only

export const commentRouter = router;
