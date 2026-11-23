import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Note from '../models/Note.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to remove local uploaded image
const safeDeleteImage = (imageFilename) => {
  if (!imageFilename) return;
  const filePath = path.join(__dirname, '..', 'uploads', path.basename(imageFilename));
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not remove file:', filePath, e.message);
    }
  }
};

// @desc Get all notes with search, date filter & date grouping
// @route GET /api/notes
export const getNotes = async (req, res) => {
  try {
    const { search, date, month, sort = 'latest' } = req.query;

    const query = {};

    // 1. Month filter (e.g. "2026-08")
    if (month) {
      query.$or = [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ];
    } else if (date) {
      // 2. Specific Date filter (e.g. "2026-07-10")
      query.$or = [{ date: date }, { groupDate: date }];
    }

    // 3. Search filter (search by title, content, or category)
    if (search && search.trim()) {
      const monthNames = {
        january: '01', jan: '01',
        february: '02', feb: '02',
        march: '03', mar: '03',
        april: '04', apr: '04',
        may: '05',
        june: '06', jun: '06',
        july: '07', jul: '07',
        august: '08', aug: '08',
        september: '09', sep: '09',
        october: '10', oct: '10',
        november: '11', nov: '11',
        december: '12', dec: '12',
      };
      const cleanSearch = search.trim().toLowerCase();
      const matchedMonthNum = monthNames[cleanSearch];

      if (matchedMonthNum) {
        const monthQuery = {
          $or: [
            { date: { $regex: `-${matchedMonthNum}-` } },
            { groupDate: { $regex: `-${matchedMonthNum}-` } },
          ],
        };
        if (query.$or) {
          query.$and = [{ $or: query.$or }, monthQuery];
          delete query.$or;
        } else {
          query.$or = monthQuery.$or;
        }
      } else {
        const searchRegex = { $regex: search.trim(), $options: 'i' };
        const textSearch = [
          { title: searchRegex },
          { content: searchRegex },
          { category: searchRegex },
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: textSearch }];
          delete query.$or;
        } else {
          query.$or = textSearch;
        }
      }
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const notes = await Note.find(query).sort({ date: sortOrder, time: sortOrder, createdAt: sortOrder });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayNotesCount = 0;

    // Group notes by date / groupDate
    const groupsMap = {};
    notes.forEach((note) => {
      const gDate = note.groupDate || note.date || 'Unspecified';
      if (!groupsMap[gDate]) {
        groupsMap[gDate] = {
          date: gDate,
          items: [],
          count: 0,
        };
      }
      groupsMap[gDate].items.push(note);
      groupsMap[gDate].count += 1;

      if (gDate === todayStr || note.date === todayStr) {
        todayNotesCount += 1;
      }
    });

    const groups = Object.values(groupsMap).sort((a, b) => {
      return sortOrder === 1
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return res.json({
      success: true,
      count: notes.length,
      todayNotesCount,
      data: groups,
      allItems: notes,
    });
  } catch (error) {
    console.error('getNotes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notes',
      error: error.message,
    });
  }
};

// @desc Create a new note
// @route POST /api/notes
export const createNote = async (req, res) => {
  try {
    const { title, content, category, date, time, groupDate } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowTimestamp = `${currentDateStr} ${currentTimeStr}`;

    const noteDate = date || currentDateStr;
    const noteTime = time || currentTimeStr;
    const noteGroupDate = groupDate || noteDate;

    // If added to a previous date cart, updatedDate records the present current date/time!
    const effectiveUpdatedDate = (noteGroupDate && noteGroupDate !== currentDateStr)
      ? nowTimestamp
      : `${noteDate} ${noteTime}`;

    let image = '';
    if (req.file) {
      image = req.file.filename;
    }

    const newNote = await Note.create({
      title: (title && title.trim()) ? title.trim() : 'General Note',
      content: content.trim(),
      category: (category && category.trim()) ? category.trim() : 'General',
      image,
      date: noteDate,
      time: noteTime,
      groupDate: noteGroupDate,
      updatedDate: effectiveUpdatedDate,
      editCount: 0,
      editHistory: [],
    });

    return res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('createNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message,
    });
  }
};

// @desc Update note with change tracking
// @route PUT /api/notes/:id
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const { title, content, category, date, time, groupDate } = req.body;

    // Snapshot previous values for editHistory
    const previousValues = {
      title: note.title,
      content: note.content,
      category: note.category,
      image: note.image,
      date: note.date,
      time: note.time,
      groupDate: note.groupDate,
    };

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content.trim();
    if (category !== undefined) note.category = category.trim();
    if (date !== undefined) note.date = date;
    if (time !== undefined) note.time = time;
    if (groupDate !== undefined) note.groupDate = groupDate;

    if (req.file) {
      safeDeleteImage(note.image);
      note.image = req.file.filename;
    }

    const now = new Date();
    const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    note.updatedDate = nowTimestamp;
    note.editCount = (note.editCount || 0) + 1;

    const updatedValues = {
      title: note.title,
      content: note.content,
      category: note.category,
      image: note.image,
      date: note.date,
      time: note.time,
      groupDate: note.groupDate,
    };

    // Calculate diff for note summary
    const changes = [];
    if (previousValues.title !== updatedValues.title) {
      changes.push(`Title: "${previousValues.title}" → "${updatedValues.title}"`);
    }
    if (previousValues.content !== updatedValues.content) {
      changes.push('Content updated');
    }
    if (previousValues.category !== updatedValues.category) {
      changes.push(`Category: "${previousValues.category}" → "${updatedValues.category}"`);
    }
    if (previousValues.date !== updatedValues.date) {
      changes.push(`Date: ${previousValues.date} → ${updatedValues.date}`);
    }

    const noteText = changes.length > 0 ? changes.join(' | ') : `Edited note #${note.editCount}`;

    note.editHistory.push({
      previousValues,
      updatedValues,
      timestamp: nowTimestamp,
      note: noteText,
    });

    const updated = await note.save();

    return res.json({
      success: true,
      data: updated,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('updateNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message,
    });
  }
};

// @desc Delete note
// @route DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    safeDeleteImage(note.image);
    await Note.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      id: req.params.id,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('deleteNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message,
    });
  }
};

// @desc Delete notes by month
// @route DELETE /api/notes/month/:month
export const deleteNotesByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-07)',
      });
    }

    const notesToDelete = await Note.find({
      $or: [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ],
    });

    notesToDelete.forEach((n) => safeDeleteImage(n.image));

    const result = await Note.deleteMany({
      $or: [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ],
    });

    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} notes for month ${month}`,
    });
  } catch (error) {
    console.error('deleteNotesByMonth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notes for month',
      error: error.message,
    });
  }
};
