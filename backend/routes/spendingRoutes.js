import express from 'express';
import {
  getSpending,
  createSpending,
  updateSpending,
  deleteSpending,
  deleteSpendingByMonth,
} from '../controllers/spendingController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getSpending)
  .post(protect, upload.single('image'), createSpending);

// Delete all spending records for a month
router.delete('/month/:month', protect, deleteSpendingByMonth);

router.route('/:id')
  .put(protect, upload.single('image'), updateSpending)
  .delete(protect, deleteSpending);

export default router;
