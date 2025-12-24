import express from 'express';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost
} from '../controllers/postController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

export const postRouter = router;

