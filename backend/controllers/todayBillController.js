import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TodayBill from '../models/TodayBill.js';
import BillHistory from '../models/BillHistory.js';

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

// @desc Get bills with date grouping & total calculation
// @route GET /api/today-bill
export const getTodayBills = async (req, res) => {
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

    // 3. Search filter (bill name or month name like "August")
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
        query.billName = { $regex: search.trim(), $options: 'i' };
      }
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const bills = await TodayBill.find(query).sort({ groupDate: sortOrder, date: sortOrder, time: sortOrder });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayTotal = 0;
    let allTotal = 0;

    const groupsMap = {};
    bills.forEach((bill) => {
      const gDate = bill.groupDate || bill.date || 'Unspecified';
      if (!groupsMap[gDate]) {
        groupsMap[gDate] = {
          date: gDate,
          isToday: gDate === todayStr,
          items: [],
          total: 0,
        };
      }
      groupsMap[gDate].items.push(bill);
      const amountNum = Number(bill.amount) || 0;
      groupsMap[gDate].total = Number((groupsMap[gDate].total + amountNum).toFixed(2));
      allTotal = Number((allTotal + amountNum).toFixed(2));

      if (gDate === todayStr || bill.date === todayStr) {
        todayTotal = Number((todayTotal + amountNum).toFixed(2));
      }
    });

    const groupedData = Object.values(groupsMap).sort((a, b) => {
      return sortOrder === 1
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return res.json({
      success: true,
      count: bills.length,
      data: groupedData,
      allBills: bills,
      todayTotal,
      allTotal,
    });
  } catch (error) {
    console.error('getTodayBills error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message,
    });
  }
};

// @desc Create new bill (and archive copy to BillHistory)
// @route POST /api/today-bill
export const createTodayBill = async (req, res) => {
  try {
    const { billName, amount, date, time, groupDate } = req.body;

    if (!billName || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Bill name and amount are required',
      });
    }

    const parsedAmount = parseFloat(amount) || 0;
    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowTimestamp = `${currentDateStr} ${currentTimeStr}`;

    const actualDate = date || currentDateStr;
    const actualTime = time || currentTimeStr;
    const effectiveGroupDate = groupDate || actualDate;

    // If added to a previous date cart, updatedDate records the present current date/time!
    const effectiveUpdatedDate = (effectiveGroupDate && effectiveGroupDate !== currentDateStr)
      ? nowTimestamp
      : `${actualDate} ${actualTime}`;

    let image = '';
    if (req.file) {
      image = req.file.filename;
    }

    const newBill = await TodayBill.create({
      billName: billName.trim(),
      amount: parsedAmount,
      image,
      date: actualDate,
      time: actualTime,
      groupDate: effectiveGroupDate,
      updatedDate: effectiveUpdatedDate,
      editCount: 0,
      editHistory: [],
    });

    // Mirror to BillHistory
    try {
      await BillHistory.create({
        billName: billName.trim(),
        amount: parsedAmount,
        image,
        date: actualDate,
        time: actualTime,
        groupDate: effectiveGroupDate,
        updatedDate: effectiveUpdatedDate,
        editCount: 0,
        editHistory: [],
      });
    } catch (e) {
      console.warn('BillHistory sync note:', e.message);
    }

    return res.status(201).json({
      success: true,
      data: newBill,
      message: 'Bill recorded successfully',
    });
  } catch (error) {
    console.error('createTodayBill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message,
    });
  }
};

// @desc Update bill
// @route PUT /api/today-bill/:id
export const updateTodayBill = async (req, res) => {
  try {
    const bill = await TodayBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    const { billName, amount, date, time, groupDate, note } = req.body;

    const previousValues = {
      billName: bill.billName,
      amount: bill.amount,
      image: bill.image,
      date: bill.date,
      time: bill.time,
      groupDate: bill.groupDate,
    };

    if (billName !== undefined) bill.billName = billName.trim();
    if (amount !== undefined) bill.amount = parseFloat(amount) || 0;
    if (date !== undefined) bill.date = date;
    if (time !== undefined) bill.time = time;
    if (groupDate !== undefined) bill.groupDate = groupDate;

    if (req.file) {
      safeDeleteImage(bill.image);
      bill.image = req.file.filename;
    }

    const now = new Date();
    const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    bill.updatedDate = nowTimestamp;
    bill.editCount = (bill.editCount || 0) + 1;

    const updatedValues = {
      billName: bill.billName,
      amount: bill.amount,
      image: bill.image,
      date: bill.date,
      time: bill.time,
      groupDate: bill.groupDate,
    };

    // Calculate human-readable diff of what changed
    const changes = [];
    if (previousValues.billName !== updatedValues.billName) {
      changes.push(`Description: "${previousValues.billName}" → "${updatedValues.billName}"`);
    }
    if (Number(previousValues.amount) !== Number(updatedValues.amount)) {
      changes.push(`Amount: ₹${previousValues.amount} → ₹${updatedValues.amount}`);
    }

    const noteText = note || (changes.length > 0 ? changes.join(' | ') : `Edited bill #${bill.editCount}`);

    bill.editHistory.push({
      previousValues,
      updatedValues,
      timestamp: nowTimestamp,
      note: noteText,
    });

    const updated = await bill.save();

    return res.json({
      success: true,
      data: updated,
      message: 'Bill updated successfully',
    });
  } catch (error) {
    console.error('updateTodayBill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error.message,
    });
  }
};

// @desc Delete bill
// @route DELETE /api/today-bill/:id
export const deleteTodayBill = async (req, res) => {
  try {
    const bill = await TodayBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    safeDeleteImage(bill.image);
    await bill.deleteOne();

    return res.json({
      success: true,
      message: 'Bill deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    console.error('deleteTodayBill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bill',
      error: error.message,
    });
  }
};

// @desc Delete all today bills for a specific month (YYYY-MM)
// @route DELETE /api/today-bill/month/:month
export const deleteTodayBillsByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month format YYYY-MM is required (e.g. 2026-08)',
      });
    }

    const itemsToDelete = await TodayBill.find({
      $or: [
        { groupDate: { $regex: `^${month}` } },
        { date: { $regex: `^${month}` } },
      ],
    });

    itemsToDelete.forEach((bill) => {
      if (bill.image) {
        safeDeleteImage(bill.image);
      }
    });

    const result = await TodayBill.deleteMany({
      $or: [
        { groupDate: { $regex: `^${month}` } },
        { date: { $regex: `^${month}` } },
      ],
    });

    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} bills for month ${month}`,
    });
  } catch (error) {
    console.error('deleteTodayBillsByMonth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete month data',
      error: error.message,
    });
  }
};
