import express from 'express';
import {
  getBillsHistory,
  createBillHistory,
  updateBillHistory,
  deleteBillHistory,
  deleteBillsHistoryByMonth,
} from '../controllers/billController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getBillsHistory)
  .post(protect, upload.single('image'), createBillHistory);

// Delete all bills for a month
router.delete('/month/:month', protect, deleteBillsHistoryByMonth);

router.route('/:id')
  .put(protect, upload.single('image'), updateBillHistory)
  .delete(protect, deleteBillHistory);

export default router;
