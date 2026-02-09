import express from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.get('/', getComments);
router.post('/', createComment); // Public
router.delete('/:id', deleteComment); // Public (password protected)

export const commentRouter = router;
