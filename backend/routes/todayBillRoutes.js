import express from 'express';
import {
  getTodayBills,
  createTodayBill,
  updateTodayBill,
  deleteTodayBill,
  deleteTodayBillsByMonth,
} from '../controllers/todayBillController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getTodayBills)
  .post(upload.single('image'), createTodayBill);

// Delete all today bills for a month
router.delete('/month/:month', deleteTodayBillsByMonth);

router.route('/:id')
  .put(upload.single('image'), updateTodayBill)
  .delete(deleteTodayBill);

export default router;
