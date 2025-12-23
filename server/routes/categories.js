import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategory);
router.patch('/reorder', reorderCategories); // Specific routes before parameters
router.delete('/:name', deleteCategory);
router.patch('/:id', updateCategory);

export const categoryRouter = router;

