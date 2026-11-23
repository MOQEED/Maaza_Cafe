import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteNotesByMonth,
} from '../controllers/noteController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getNotes)
  .post(upload.single('image'), createNote);

// Delete all notes for a specific month
router.delete('/month/:month', deleteNotesByMonth);

router.route('/:id')
  .put(upload.single('image'), updateNote)
  .delete(deleteNote);

export default router;
