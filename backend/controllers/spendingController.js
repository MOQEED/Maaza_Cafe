import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Spending from '../models/Spending.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// @desc Get all spending records grouped by date
// @route GET /api/spending
export const getSpending = async (req, res) => {
  try {
    const { search, date, month, sort = 'latest' } = req.query;

    const query = {};

    // 1. Month filter (e.g. "2026-08")
    if (month) {
      query.$or = [
        { groupDate: { $regex: `^${month}` } },
        { date: { $regex: `^${month}` } },
      ];
    } else if (date) {
      // 2. Specific Date filter
      query.$or = [{ groupDate: date }, { date: date }];
    }

    // 3. Search filter (item name or month name like "August")
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
            { groupDate: { $regex: `-${matchedMonthNum}-` } },
            { date: { $regex: `-${matchedMonthNum}-` } },
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
    const items = await Spending.find(query).sort({ groupDate: sortOrder, date: sortOrder, time: sortOrder });

    const todayStr = new Date().toISOString().split('T')[0];
    let totalSpending = 0;
    let todaySpending = 0;

    const groupsMap = {};
    items.forEach((item) => {
      const gDate = item.groupDate || item.date || 'Unspecified';
      if (!groupsMap[gDate]) {
        groupsMap[gDate] = {
          date: gDate,
          isToday: gDate === todayStr,
          items: [],
          total: 0,
        };
      }
      groupsMap[gDate].items.push(item);
      const itemTotal = Number(item.totalPrice) || (Number(item.quantity) * Number(item.price)) || 0;
      groupsMap[gDate].total = Number((groupsMap[gDate].total + itemTotal).toFixed(2));
      totalSpending = Number((totalSpending + itemTotal).toFixed(2));

      if (gDate === todayStr) {
        todaySpending = Number((todaySpending + itemTotal).toFixed(2));
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
      totalSpending,
      todaySpending,
    });
  } catch (error) {
    console.error('getSpending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch spending records',
      error: error.message,
    });
  }
};

// @desc Create new spending record (with support for "Add to Previous Date")
// @route POST /api/spending
export const createSpending = async (req, res) => {
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

    // date/time reflects when the entry was physically recorded
    const actualDate = date || currentDateStr;
    const actualTime = time || currentTimeStr;
    // groupDate determines the date group (e.g. historical date when "Add for Date" is used)
    const effectiveGroupDate = groupDate || actualDate;

    // If added to a previous date cart, updatedDate records the present current date/time!
    const effectiveUpdatedDate = (effectiveGroupDate && effectiveGroupDate !== currentDateStr)
      ? nowTimestamp
      : `${actualDate} ${actualTime}`;

    let image = '';
    if (req.file) {
      image = req.file.filename;
    }

    const newSpending = await Spending.create({
      itemName: itemName.trim(),
      quantity: parsedQty,
      price: parsedPrice,
      totalPrice,
      image,
      date: actualDate,
      time: actualTime,
      groupDate: effectiveGroupDate,
      updatedDate: effectiveUpdatedDate,
      editCount: 0,
      editHistory: [],
    });

    return res.status(201).json({
      success: true,
      data: newSpending,
      message: 'Spending recorded successfully',
    });
  } catch (error) {
    console.error('createSpending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record spending',
      error: error.message,
    });
  }
};

// @desc Update spending record with change history tracking
// @route PUT /api/spending/:id
export const updateSpending = async (req, res) => {
  try {
    const item = await Spending.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Spending record not found',
      });
    }

    const { itemName, quantity, price, date, time, groupDate, note } = req.body;

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

    const noteText = note || (changes.length > 0 ? changes.join(' | ') : `Edited spending #${item.editCount}`);

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
      message: 'Spending updated successfully',
    });
  } catch (error) {
    console.error('updateSpending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update spending',
      error: error.message,
    });
  }
};

// @desc Delete spending record
// @route DELETE /api/spending/:id
export const deleteSpending = async (req, res) => {
  try {
    const item = await Spending.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Spending record not found',
      });
    }

    safeDeleteImage(item.image);
    await item.deleteOne();

    return res.json({
      success: true,
      message: 'Spending record deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    console.error('deleteSpending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete spending record',
      error: error.message,
    });
  }
};

// @desc Delete all spending records for a specific month (YYYY-MM)
// @route DELETE /api/spending/month/:month
export const deleteSpendingByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month format YYYY-MM is required (e.g. 2026-08)',
      });
    }

    const itemsToDelete = await Spending.find({
      $or: [
        { groupDate: { $regex: `^${month}` } },
        { date: { $regex: `^${month}` } },
      ],
    });

    itemsToDelete.forEach((item) => {
      if (item.image) {
        safeDeleteImage(item.image);
      }
    });

    const result = await Spending.deleteMany({
      $or: [
        { groupDate: { $regex: `^${month}` } },
        { date: { $regex: `^${month}` } },
      ],
    });

    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} spending records for month ${month}`,
    });
  } catch (error) {
    console.error('deleteSpendingByMonth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete spending month data',
      error: error.message,
    });
  }
};
