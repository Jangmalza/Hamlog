import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory
} from '../controllers/categoryController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticateToken, createCategory);
router.patch('/reorder', authenticateToken, reorderCategories); // Specific routes before parameters
router.delete('/:name', authenticateToken, deleteCategory);
router.patch('/:id', authenticateToken, updateCategory);

export const categoryRouter = router;

