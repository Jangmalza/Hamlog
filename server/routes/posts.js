import express from 'express';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getPostRevisions,
  restorePostRevision
} from '../controllers/postController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/', authenticateToken, createPost);
router.get('/:id/revisions', authenticateToken, getPostRevisions);
router.post('/:id/revisions/:revisionId/restore', authenticateToken, restorePostRevision);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

export const postRouter = router;
