import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DailyItem from '../models/DailyItem.js';

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

// @desc Get all daily items with search, date filter & date grouping
// @route GET /api/daily-items
export const getDailyItems = async (req, res) => {
  try {
    const { search, date, month, sort = 'latest' } = req.query;

    const query = {};

    // 1. Month filter (e.g. "2026-08" or "2026-07")
    if (month) {
      query.$or = [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ];
    } else if (date) {
      // 2. Specific Date filter (e.g. "2026-07-10")
      query.$or = [{ date: date }, { groupDate: date }];
    }

    // 3. Search filter (can search by item name OR month name like "August", "July")
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
        query.itemName = { $regex: search.trim(), $options: 'i' };
      }
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const items = await DailyItem.find(query).sort({ date: sortOrder, time: sortOrder, createdAt: sortOrder });

    // Calculate today's total
    const todayStr = new Date().toISOString().split('T')[0];
    let todayTotal = 0;

    // Group items by date / groupDate
    const groupsMap = {};
    items.forEach((item) => {
      const gDate = item.groupDate || item.date || 'Unspecified';
      if (!groupsMap[gDate]) {
        groupsMap[gDate] = {
          date: gDate,
          items: [],
          total: 0,
        };
      }
      groupsMap[gDate].items.push(item);
      const itemTotal = Number(item.totalPrice) || (Number(item.quantity) * Number(item.price)) || 0;
      groupsMap[gDate].total = Number((groupsMap[gDate].total + itemTotal).toFixed(2));

      if (gDate === todayStr || item.date === todayStr) {
        todayTotal = Number((todayTotal + itemTotal).toFixed(2));
      }
    });

    const groupedData = Object.values(groupsMap).sort((a, b) => {
      return sortOrder === 1
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return res.json({
      success: true,
      count: items.length,
      data: groupedData,
      allItems: items,
      todayTotal,
    });
  } catch (error) {
    console.error('getDailyItems error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily items',
      error: error.message,
    });
  }
};

// @desc Create a new daily item
// @route POST /api/daily-items
export const createDailyItem = async (req, res) => {
  try {
    const { itemName, quantity, price, date, time, groupDate } = req.body;

    if (!itemName || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Item name, quantity, and price are required',
      });
    }

    const parsedQty = parseFloat(quantity) || 1;
    const parsedPrice = parseFloat(price) || 0;
    const totalPrice = Number((parsedQty * parsedPrice).toFixed(2));

    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowTimestamp = `${currentDateStr} ${currentTimeStr}`;

    const itemDate = date || currentDateStr;
    const itemTime = time || currentTimeStr;
    const itemGroupDate = groupDate || itemDate;

    // If added to a previous date cart, updatedDate records the present current date/time!
    const effectiveUpdatedDate = (itemGroupDate && itemGroupDate !== currentDateStr)
      ? nowTimestamp
      : `${itemDate} ${itemTime}`;

    let image = '';
    if (req.file) {
      image = req.file.filename;
    }

    const newItem = await DailyItem.create({
      itemName: itemName.trim(),
      quantity: parsedQty,
      price: parsedPrice,
      totalPrice,
      image,
      date: itemDate,
      time: itemTime,
      groupDate: itemGroupDate,
      updatedDate: effectiveUpdatedDate,
      editCount: 0,
      editHistory: [],
    });

    return res.status(201).json({
      success: true,
      data: newItem,
      message: 'Daily item created successfully',
    });
  } catch (error) {
    console.error('createDailyItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create daily item',
      error: error.message,
    });
  }
};

// @desc Update daily item with change tracking
// @route PUT /api/daily-items/:id
export const updateDailyItem = async (req, res) => {
  try {
    const item = await DailyItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const { itemName, quantity, price, date, time, groupDate, note } = req.body;

    // Snapshot previous values for editHistory
    const previousValues = {
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      image: item.image,
      date: item.date,
      time: item.time,
      groupDate: item.groupDate,
    };

    if (itemName !== undefined) item.itemName = itemName.trim();
    if (quantity !== undefined) item.quantity = parseFloat(quantity) || 1;
    if (price !== undefined) item.price = parseFloat(price) || 0;
    if (date !== undefined) item.date = date;
    if (time !== undefined) item.time = time;
    if (groupDate !== undefined) item.groupDate = groupDate;

    item.totalPrice = Number((item.quantity * item.price).toFixed(2));

    if (req.file) {
      safeDeleteImage(item.image);
      item.image = req.file.filename;
    }

    const now = new Date();
    const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    item.updatedDate = nowTimestamp;
    item.editCount = (item.editCount || 0) + 1;

    const updatedValues = {
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      image: item.image,
      date: item.date,
      time: item.time,
      groupDate: item.groupDate,
    };

    // Calculate human-readable diff of what changed
    const changes = [];
    if (previousValues.itemName !== updatedValues.itemName) {
      changes.push(`Name: "${previousValues.itemName}" → "${updatedValues.itemName}"`);
    }
    if (Number(previousValues.quantity) !== Number(updatedValues.quantity)) {
      changes.push(`Qty: ${previousValues.quantity} → ${updatedValues.quantity}`);
    }
    if (Number(previousValues.price) !== Number(updatedValues.price)) {
      changes.push(`Price: ₹${previousValues.price} → ₹${updatedValues.price}`);
    }
    if (Number(previousValues.totalPrice) !== Number(updatedValues.totalPrice)) {
      changes.push(`Total: ₹${previousValues.totalPrice} → ₹${updatedValues.totalPrice}`);
    }

    const noteText = note || (changes.length > 0 ? changes.join(' | ') : `Edited item #${item.editCount}`);

    item.editHistory.push({
      previousValues,
      updatedValues,
      timestamp: nowTimestamp,
      note: noteText,
    });

    const updated = await item.save();

    return res.json({
      success: true,
      data: updated,
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('updateDailyItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message,
    });
  }
};

// @desc Delete daily item
// @route DELETE /api/daily-items/:id
export const deleteDailyItem = async (req, res) => {
  try {
    const item = await DailyItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    safeDeleteImage(item.image);
    await item.deleteOne();

    return res.json({
      success: true,
      message: 'Item deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    console.error('deleteDailyItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message,
    });
  }
};

// @desc Delete all daily items for a specific month (YYYY-MM)
// @route DELETE /api/daily-items/month/:month
export const deleteDailyItemsByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month format YYYY-MM is required (e.g. 2026-08)',
      });
    }

    // Find all items in this month to safely remove any uploaded images
    const itemsToDelete = await DailyItem.find({
      $or: [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ],
    });

    itemsToDelete.forEach((item) => {
      if (item.image) {
        safeDeleteImage(item.image);
      }
    });

    const result = await DailyItem.deleteMany({
      $or: [
        { date: { $regex: `^${month}` } },
        { groupDate: { $regex: `^${month}` } },
      ],
    });

    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} items for month ${month}`,
    });
  } catch (error) {
    console.error('deleteDailyItemsByMonth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete month data',
      error: error.message,
    });
  }
};
