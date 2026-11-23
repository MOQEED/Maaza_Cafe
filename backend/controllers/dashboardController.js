import DailyItem from '../models/DailyItem.js';
import Spending from '../models/Spending.js';
import TodayBill from '../models/TodayBill.js';
import BillHistory from '../models/BillHistory.js';

// @desc Get real-time stats for the dashboard
// @route GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Counts
    const dailyItemsCount = await DailyItem.countDocuments();
    const todayBillsCount = await TodayBill.countDocuments({
      $or: [{ date: todayStr }, { groupDate: todayStr }],
    });
    const totalBillsCount = await TodayBill.countDocuments();
    const billsHistoryCount = await BillHistory.countDocuments();

    // Spending totals
    const allSpendings = await Spending.find({});
    let spendingTotal = 0;
    let todaySpending = 0;

    allSpendings.forEach((s) => {
      const amt = Number(s.totalPrice) || (Number(s.quantity) * Number(s.price)) || 0;
      spendingTotal += amt;
      if (s.groupDate === todayStr || s.date === todayStr) {
        todaySpending += amt;
      }
    });

    // Today bills total
    const todayBills = await TodayBill.find({
      $or: [{ date: todayStr }, { groupDate: todayStr }],
    });
    let todayBillsTotal = 0;
    todayBills.forEach((b) => {
      todayBillsTotal += Number(b.amount) || 0;
    });

    // Today bills from BillHistory
    const todayHistBills = await BillHistory.find({
      $or: [{ date: todayStr }, { groupDate: todayStr }],
    });
    let todayHistBillsTotal = 0;
    todayHistBills.forEach((b) => {
      todayHistBillsTotal += Number(b.amount) || 0;
    });

    // Sync between the two collections if one has today's bills
    if (todayBillsTotal === 0 && todayHistBillsTotal > 0) {
      todayBillsTotal = todayHistBillsTotal;
    } else if (todayHistBillsTotal === 0 && todayBillsTotal > 0) {
      todayHistBillsTotal = todayBillsTotal;
    }

    // Today daily items total
    const todayItems = await DailyItem.find({
      $or: [{ date: todayStr }, { groupDate: todayStr }],
    });
    let todayItemsTotal = 0;
    todayItems.forEach((it) => {
      todayItemsTotal += Number(it.totalPrice) || (Number(it.quantity) * Number(it.price)) || 0;
    });

    // Bills history total
    const allBillHistory = await BillHistory.find({});
    let allTimeBillsHistoryTotal = 0;
    allBillHistory.forEach((b) => {
      allTimeBillsHistoryTotal += Number(b.amount) || 0;
    });

    // Recent activities (last 5 entries across collections)
    const recentItems = await DailyItem.find({}).sort({ createdAt: -1 }).limit(3);
    const recentSpendings = await Spending.find({}).sort({ createdAt: -1 }).limit(3);
    const recentBills = await TodayBill.find({}).sort({ createdAt: -1 }).limit(3);

    return res.json({
      success: true,
      data: {
        dailyItemsCount,
        todayItemsTotal: Number(todayItemsTotal.toFixed(2)),
        spendingTotal: Number(spendingTotal.toFixed(2)),
        todaySpendingTotal: Number(todaySpending.toFixed(2)),
        todayBillsCount: todayBillsCount || totalBillsCount,
        todayBillsTotal: Number(todayBillsTotal.toFixed(2)),
        todayHistBillsTotal: Number(todayHistBillsTotal.toFixed(2)),
        billsHistoryCount: billsHistoryCount || totalBillsCount,
        // Card 4 should show today's bill amount
        billsHistoryTotal: Number((todayHistBillsTotal || todayBillsTotal).toFixed(2)),
        allTimeBillsHistoryTotal: Number(allTimeBillsHistoryTotal.toFixed(2)),
        recentActivity: {
          items: recentItems,
          spendings: recentSpendings,
          bills: recentBills,
        },
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};
