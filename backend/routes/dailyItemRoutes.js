import express from 'express';
import {
  getDailyItems,
  createDailyItem,
  updateDailyItem,
  deleteDailyItem,
  deleteDailyItemsByMonth,
} from '../controllers/dailyItemController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getDailyItems)
  .post(upload.single('image'), createDailyItem);

// Delete all items for a month
router.delete('/month/:month', deleteDailyItemsByMonth);

router.route('/:id')
  .put(upload.single('image'), updateDailyItem)
  .delete(deleteDailyItem);

export default router;
