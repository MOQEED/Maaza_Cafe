import axios from 'axios';
import { getAuthToken, removeAuthToken, removeUserData } from '../utils/cookies';

const API_URL = import.meta.env.VITE_API_URL || '';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  return `${API_URL}/uploads/${imagePath}`;
};

// Create configured Axios client instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

// Request interceptor: attach bearer token from cookies
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto handle session expiry (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      removeUserData();
    }
    return Promise.reject(error);
  }
);

// Local fallback storage helpers for high reliability
const getLocalData = (key, defaultVal = []) => {
  try {
    const raw = localStorage.getItem(`maaza_fallback_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalData = (key, data) => {
  try {
    localStorage.setItem(`maaza_fallback_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
};

// Unified request handler using Axios with offline fallback support
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const config = {
    url: endpoint,
    method,
    headers: { ...options.headers },
  };

  if (options.body) {
    if (options.body instanceof FormData) {
      config.data = options.body;
    } else {
      config.data = options.body;
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
  }

  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      `Request failed with status ${error.response?.status || 'network error'}`;
    console.warn(`API call failed for ${endpoint}:`, message);
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    throw customError;
  }
}

// ==========================================
// 1. DAILY ITEMS
// ==========================================
export const fetchDailyItems = async ({ search = '', date = '', month = '', sort = 'latest' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (date) params.append('date', date);
  if (month) params.append('month', month);
  if (sort) params.append('sort', sort);

  try {
    const res = await request(`/api/daily-items?${params.toString()}`);
    if (res.success && res.allItems) {
      setLocalData('daily_items', res.allItems);
    }
    return res;
  } catch {
    // Offline local fallback
    let items = getLocalData('daily_items', [
      {
        _id: 'seed-item-1',
        itemName: 'Fresh Arabica Coffee Beans',
        quantity: 5,
        price: 350,
        totalPrice: 1750,
        date: new Date().toISOString().split('T')[0],
        time: '08:30:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 08:30:00`,
        editCount: 0,
        editHistory: [],
      },
      {
        _id: 'seed-item-2',
        itemName: 'Organic Full Cream Milk (10L)',
        quantity: 10,
        price: 65,
        totalPrice: 650,
        date: new Date().toISOString().split('T')[0],
        time: '09:15:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 09:15:00`,
        editCount: 0,
        editHistory: [],
      },
    ]);

    if (search) {
      items = items.filter((i) => i.itemName.toLowerCase().includes(search.toLowerCase()));
    }
    if (date) {
      items = items.filter((i) => i.date === date || i.groupDate === date);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTotal = items
      .filter((i) => i.date === todayStr || i.groupDate === todayStr)
      .reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const groupsMap = {};
    items.forEach((item) => {
      const gDate = item.groupDate || item.date || 'Today';
      if (!groupsMap[gDate]) groupsMap[gDate] = { date: gDate, items: [], total: 0 };
      groupsMap[gDate].items.push(item);
      groupsMap[gDate].total += Number(item.totalPrice) || 0;
    });

    return {
      success: true,
      count: items.length,
      data: Object.values(groupsMap),
      allItems: items,
      todayTotal,
      isLocal: true,
    };
  }
};

export const createDailyItem = async (formData) => {
  try {
    return await request('/api/daily-items', {
      method: 'POST',
      body: formData,
    });
  } catch {
    // Local fallback save
    const items = getLocalData('daily_items', []);
    const newItem = {
      _id: 'local-' + Date.now(),
      itemName: formData.get ? formData.get('itemName') : formData.itemName,
      quantity: Number(formData.get ? formData.get('quantity') : formData.quantity) || 1,
      price: Number(formData.get ? formData.get('price') : formData.price) || 0,
      totalPrice:
        (Number(formData.get ? formData.get('quantity') : formData.quantity) || 1) *
        (Number(formData.get ? formData.get('price') : formData.price) || 0),
      date: (formData.get ? formData.get('date') : formData.date) || new Date().toISOString().split('T')[0],
      time: (formData.get ? formData.get('time') : formData.time) || new Date().toLocaleTimeString(),
      groupDate: (formData.get ? formData.get('groupDate') : formData.groupDate) || new Date().toISOString().split('T')[0],
      updatedDate: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`,
      editCount: 0,
      editHistory: [],
    };
    items.unshift(newItem);
    setLocalData('daily_items', items);
    return { success: true, data: newItem, isLocal: true };
  }
};

export const updateDailyItem = async (id, formData) => {
  try {
    return await request(`/api/daily-items/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (err) {
    const items = getLocalData('daily_items', []);
    const idx = items.findIndex((i) => i._id === id);
    if (idx !== -1) {
      const existing = items[idx];
      const prev = {
        itemName: existing.itemName,
        quantity: existing.quantity,
        price: existing.price,
        totalPrice: existing.totalPrice,
        date: existing.date,
        time: existing.time,
        groupDate: existing.groupDate,
      };
      const newName = formData.get ? (formData.get('itemName') || existing.itemName) : (formData.itemName || existing.itemName);
      const newQty = Number(formData.get ? formData.get('quantity') : formData.quantity) || existing.quantity;
      const newPrice = Number(formData.get ? formData.get('price') : formData.price) || existing.price;
      const newDate = (formData.get ? formData.get('date') : formData.date) || existing.date;
      const newTime = (formData.get ? formData.get('time') : formData.time) || existing.time;
      const newGroupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || existing.groupDate;

      const now = new Date();
      const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

      const updated = {
        ...existing,
        itemName: newName,
        quantity: newQty,
        price: newPrice,
        totalPrice: Number((newQty * newPrice).toFixed(2)),
        date: newDate,
        time: newTime,
        groupDate: newGroupDate,
        editCount: (existing.editCount || 0) + 1,
        updatedDate: nowTimestamp,
      };

      const updatedValues = {
        itemName: updated.itemName,
        quantity: updated.quantity,
        price: updated.price,
        totalPrice: updated.totalPrice,
        date: updated.date,
        time: updated.time,
        groupDate: updated.groupDate,
      };

      updated.editHistory = Array.isArray(existing.editHistory) ? [...existing.editHistory] : [];
      updated.editHistory.push({
        previousValues: prev,
        updatedValues: updatedValues,
        timestamp: nowTimestamp,
        note: `Updated item #${updated.editCount}`,
      });
      items[idx] = updated;
      setLocalData('daily_items', items);
      return { success: true, data: updated, isLocal: true };
    }
    throw err;
  }
};

export const deleteDailyItem = async (id) => {
  try {
    return await request(`/api/daily-items/${id}`, { method: 'DELETE' });
  } catch {
    const items = getLocalData('daily_items', []);
    const filtered = items.filter((i) => i._id !== id);
    setLocalData('daily_items', filtered);
    return { success: true, id, isLocal: true };
  }
};

export const deleteDailyItemsByMonth = async (month) => {
  try {
    return await request(`/api/daily-items/month/${month}`, { method: 'DELETE' });
  } catch {
    const items = getLocalData('daily_items', []);
    const filtered = items.filter((i) => !((i.groupDate && i.groupDate.startsWith(month)) || (i.date && i.date.startsWith(month))));
    setLocalData('daily_items', filtered);
    return { success: true, deletedCount: items.length - filtered.length, isLocal: true };
  }
};

// ==========================================
// 2. SPENDING MONEY (Protected)
// ==========================================
export const fetchSpending = async ({ search = '', date = '', month = '', sort = 'latest' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (date) params.append('date', date);
  if (month) params.append('month', month);
  if (sort) params.append('sort', sort);

  try {
    const res = await request(`/api/spending?${params.toString()}`);
    if (res.success && res.allItems) {
      setLocalData('spendings', res.allItems);
    }
    return res;
  } catch {
    let items = getLocalData('spendings', [
      {
        _id: 'seed-spending-1',
        itemName: 'Cafe Electricity Bill - Advance',
        quantity: 1,
        price: 2400,
        totalPrice: 2400,
        date: new Date().toISOString().split('T')[0],
        time: '11:00:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 11:00:00`,
        editCount: 0,
        editHistory: [],
      },
      {
        _id: 'seed-spending-2',
        itemName: 'Paper Cups & Custom Napkins',
        quantity: 2,
        price: 450,
        totalPrice: 900,
        date: new Date().toISOString().split('T')[0],
        time: '14:20:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 14:20:00`,
        editCount: 1,
        editHistory: [
          {
            previousValues: { price: 400, totalPrice: 800 },
            updatedValues: { price: 450, totalPrice: 900 },
            timestamp: `${new Date().toISOString().split('T')[0]} 14:25:00`,
            note: 'Corrected carton unit price',
          },
        ],
      },
    ]);

    if (search) {
      items = items.filter((i) => i.itemName.toLowerCase().includes(search.toLowerCase()));
    }
    if (date) {
      items = items.filter((i) => i.date === date || i.groupDate === date);
    }

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
      const amt = Number(item.totalPrice) || 0;
      groupsMap[gDate].total += amt;
      totalSpending += amt;
      if (gDate === todayStr) todaySpending += amt;
    });

    return {
      success: true,
      count: items.length,
      data: Object.values(groupsMap),
      allItems: items,
      totalSpending,
      todaySpending,
      isLocal: true,
    };
  }
};

export const createSpending = async (formData) => {
  try {
    return await request('/api/spending', {
      method: 'POST',
      body: formData,
    });
  } catch {
    const items = getLocalData('spendings', []);
    const qty = Number(formData.get ? formData.get('quantity') : formData.quantity) || 1;
    const price = Number(formData.get ? formData.get('price') : formData.price) || 0;
    const effectiveGroupDate =
      (formData.get ? formData.get('groupDate') : formData.groupDate) ||
      (formData.get ? formData.get('date') : formData.date) ||
      new Date().toISOString().split('T')[0];

    const newItem = {
      _id: 'local-spend-' + Date.now(),
      itemName: formData.get ? formData.get('itemName') : formData.itemName,
      quantity: qty,
      price: price,
      totalPrice: qty * price,
      date: (formData.get ? formData.get('date') : formData.date) || new Date().toISOString().split('T')[0],
      time: (formData.get ? formData.get('time') : formData.time) || new Date().toLocaleTimeString(),
      groupDate: effectiveGroupDate,
      updatedDate: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`,
      editCount: 0,
      editHistory: [],
    };
    items.unshift(newItem);
    setLocalData('spendings', items);
    return { success: true, data: newItem, isLocal: true };
  }
};

export const updateSpending = async (id, formData) => {
  try {
    return await request(`/api/spending/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (err) {
    const items = getLocalData('spendings', []);
    const idx = items.findIndex((i) => i._id === id);
    if (idx !== -1) {
      const existing = items[idx];
      const prev = {
        itemName: existing.itemName,
        quantity: existing.quantity,
        price: existing.price,
        totalPrice: existing.totalPrice,
        date: existing.date,
        time: existing.time,
        groupDate: existing.groupDate,
      };
      const newName = formData.get ? (formData.get('itemName') || existing.itemName) : (formData.itemName || existing.itemName);
      const qty = Number(formData.get ? formData.get('quantity') : formData.quantity) || existing.quantity;
      const price = Number(formData.get ? formData.get('price') : formData.price) || existing.price;
      const newDate = (formData.get ? formData.get('date') : formData.date) || existing.date;
      const newTime = (formData.get ? formData.get('time') : formData.time) || existing.time;
      const newGroupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || existing.groupDate;

      const now = new Date();
      const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

      const updated = {
        ...existing,
        itemName: newName,
        quantity: qty,
        price: price,
        totalPrice: Number((qty * price).toFixed(2)),
        date: newDate,
        time: newTime,
        groupDate: newGroupDate,
        editCount: (existing.editCount || 0) + 1,
        updatedDate: nowTimestamp,
      };

      const updatedValues = {
        itemName: updated.itemName,
        quantity: updated.quantity,
        price: updated.price,
        totalPrice: updated.totalPrice,
        date: updated.date,
        time: updated.time,
        groupDate: updated.groupDate,
      };

      updated.editHistory = Array.isArray(existing.editHistory) ? [...existing.editHistory] : [];
      updated.editHistory.push({
        previousValues: prev,
        updatedValues: updatedValues,
        timestamp: nowTimestamp,
        note: formData.get ? (formData.get('note') || `Edited spending #${updated.editCount}`) : `Edited spending #${updated.editCount}`,
      });
      items[idx] = updated;
      setLocalData('spendings', items);
      return { success: true, data: updated, isLocal: true };
    }
    throw err;
  }
};

export const deleteSpending = async (id) => {
  try {
    return await request(`/api/spending/${id}`, { method: 'DELETE' });
  } catch {
    const items = getLocalData('spendings', []);
    const filtered = items.filter((i) => i._id !== id);
    setLocalData('spendings', filtered);
    return { success: true, id, isLocal: true };
  }
};

export const deleteSpendingByMonth = async (month) => {
  try {
    return await request(`/api/spending/month/${month}`, { method: 'DELETE' });
  } catch {
    const items = getLocalData('spendings', []);
    const filtered = items.filter((i) => !((i.groupDate && i.groupDate.startsWith(month)) || (i.date && i.date.startsWith(month))));
    setLocalData('spendings', filtered);
    return { success: true, deletedCount: items.length - filtered.length, isLocal: true };
  }
};

// ==========================================
// 3. TODAY'S BILL (Public)
// ==========================================
export const fetchTodayBills = async ({ search = '', date = '', month = '', sort = 'latest' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (date) params.append('date', date);
  if (month) params.append('month', month);
  if (sort) params.append('sort', sort);

  try {
    const res = await request(`/api/today-bill?${params.toString()}`);
    if (res.success && res.allBills) {
      setLocalData('today_bills', res.allBills);
    }
    return res;
  } catch {
    let bills = getLocalData('today_bills', [
      {
        _id: 'seed-bill-1',
        billName: 'Order #101: 2x Cappuccino + 1x Blueberry Muffin',
        amount: 380,
        date: new Date().toISOString().split('T')[0],
        time: '10:15:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 10:15:00`,
        editCount: 0,
        editHistory: [],
      },
      {
        _id: 'seed-bill-2',
        billName: 'Order #102: Maaza Special Combo + Hazelnut Frappe',
        amount: 520,
        date: new Date().toISOString().split('T')[0],
        time: '12:40:00',
        groupDate: new Date().toISOString().split('T')[0],
        updatedDate: `${new Date().toISOString().split('T')[0]} 12:40:00`,
        editCount: 0,
        editHistory: [],
      },
    ]);

    if (search) {
      bills = bills.filter((b) => b.billName.toLowerCase().includes(search.toLowerCase()));
    }
    if (date) {
      bills = bills.filter((b) => b.date === date || b.groupDate === date);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let todayTotal = 0;
    let allTotal = 0;

    const groupsMap = {};
    bills.forEach((bill) => {
      const gDate = bill.groupDate || bill.date || 'Today';
      if (!groupsMap[gDate]) groupsMap[gDate] = { date: gDate, isToday: gDate === todayStr, items: [], total: 0 };
      groupsMap[gDate].items.push(bill);
      const amt = Number(bill.amount) || 0;
      groupsMap[gDate].total += amt;
      allTotal += amt;
      if (gDate === todayStr || bill.date === todayStr) todayTotal += amt;
    });

    return {
      success: true,
      count: bills.length,
      data: Object.values(groupsMap),
      allBills: bills,
      todayTotal,
      allTotal,
      isLocal: true,
    };
  }
};

export const createTodayBill = async (formData) => {
  try {
    return await request('/api/today-bill', {
      method: 'POST',
      body: formData,
    });
  } catch {
    const bills = getLocalData('today_bills', []);
    const amount = Number(formData.get ? formData.get('amount') : formData.amount) || 0;
    const effectiveGroupDate =
      (formData.get ? formData.get('groupDate') : formData.groupDate) ||
      (formData.get ? formData.get('date') : formData.date) ||
      new Date().toISOString().split('T')[0];

    const newBill = {
      _id: 'local-bill-' + Date.now(),
      billName: formData.get ? formData.get('billName') : formData.billName,
      amount,
      date: (formData.get ? formData.get('date') : formData.date) || new Date().toISOString().split('T')[0],
      time: (formData.get ? formData.get('time') : formData.time) || new Date().toLocaleTimeString(),
      groupDate: effectiveGroupDate,
      updatedDate: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`,
      editCount: 0,
      editHistory: [],
    };
    bills.unshift(newBill);
    setLocalData('today_bills', bills);

    // Also mirror to bill history fallback
    const history = getLocalData('bill_history', []);
    history.unshift({ ...newBill });
    setLocalData('bill_history', history);

    return { success: true, data: newBill, isLocal: true };
  }
};

export const updateTodayBill = async (id, formData) => {
  try {
    return await request(`/api/today-bill/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (err) {
    const bills = getLocalData('today_bills', []);
    const idx = bills.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const existing = bills[idx];
      const prev = {
        billName: existing.billName,
        amount: existing.amount,
        date: existing.date,
        time: existing.time,
        groupDate: existing.groupDate,
      };
      const newBillName = formData.get ? (formData.get('billName') || existing.billName) : (formData.billName || existing.billName);
      const newAmount = Number(formData.get ? formData.get('amount') : formData.amount) || existing.amount;
      const newDate = (formData.get ? formData.get('date') : formData.date) || existing.date;
      const newTime = (formData.get ? formData.get('time') : formData.time) || existing.time;
      const newGroupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || existing.groupDate;

      const now = new Date();
      const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

      const updated = {
        ...existing,
        billName: newBillName,
        amount: newAmount,
        date: newDate,
        time: newTime,
        groupDate: newGroupDate,
        editCount: (existing.editCount || 0) + 1,
        updatedDate: nowTimestamp,
      };

      const updatedValues = {
        billName: updated.billName,
        amount: updated.amount,
        date: updated.date,
        time: updated.time,
        groupDate: updated.groupDate,
      };

      updated.editHistory = Array.isArray(existing.editHistory) ? [...existing.editHistory] : [];
      updated.editHistory.push({
        previousValues: prev,
        updatedValues: updatedValues,
        timestamp: nowTimestamp,
        note: `Updated bill #${updated.editCount}`,
      });
      bills[idx] = updated;
      setLocalData('today_bills', bills);
      return { success: true, data: updated, isLocal: true };
    }
    throw err;
  }
};

export const deleteTodayBill = async (id) => {
  try {
    return await request(`/api/today-bill/${id}`, { method: 'DELETE' });
  } catch {
    const bills = getLocalData('today_bills', []);
    const filtered = bills.filter((b) => b._id !== id);
    setLocalData('today_bills', filtered);
    return { success: true, id, isLocal: true };
  }
};

export const deleteTodayBillsByMonth = async (month) => {
  try {
    return await request(`/api/today-bill/month/${month}`, { method: 'DELETE' });
  } catch {
    const bills = getLocalData('today_bills', []);
    const filtered = bills.filter((b) => !((b.groupDate && b.groupDate.startsWith(month)) || (b.date && b.date.startsWith(month))));
    setLocalData('today_bills', filtered);
    return { success: true, deletedCount: bills.length - filtered.length, isLocal: true };
  }
};

// ==========================================
// 4. BILLS HISTORY (Protected)
// ==========================================
export const fetchBillsHistory = async ({ search = '', date = '', month = '', sort = 'latest' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (date) params.append('date', date);
  if (month) params.append('month', month);
  if (sort) params.append('sort', sort);

  try {
    const res = await request(`/api/bills?${params.toString()}`);
    if (res.success && res.allBills) {
      setLocalData('bill_history', res.allBills);
    }
    return res;
  } catch {
    let bills = getLocalData('bill_history', []);
    if (bills.length === 0) {
      bills = getLocalData('today_bills', []);
    }

    if (search) {
      bills = bills.filter((b) => b.billName.toLowerCase().includes(search.toLowerCase()));
    }
    if (date) {
      bills = bills.filter((b) => b.date === date || b.groupDate === date);
    }

    let grandTotal = 0;
    const groupsMap = {};
    bills.forEach((bill) => {
      const gDate = bill.groupDate || bill.date || 'Unspecified';
      if (!groupsMap[gDate]) groupsMap[gDate] = { date: gDate, items: [], total: 0 };
      groupsMap[gDate].items.push(bill);
      const amt = Number(bill.amount) || 0;
      groupsMap[gDate].total += amt;
      grandTotal += amt;
    });

    return {
      success: true,
      count: bills.length,
      data: Object.values(groupsMap),
      allBills: bills,
      grandTotal,
      isLocal: true,
    };
  }
};

export const createBillHistory = async (formData) => {
  try {
    return await request('/api/bills', {
      method: 'POST',
      body: formData,
    });
  } catch {
    const bills = getLocalData('bill_history', []);
    const currentDateStr = new Date().toISOString().split('T')[0];
    const groupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || currentDateStr;
    const isHistorical = groupDate !== currentDateStr;
    const nowTimeStr = new Date().toLocaleTimeString();

    const newBill = {
      _id: 'bill-' + Date.now(),
      billName: (formData.get ? formData.get('billName') : formData.billName) || 'Historical Bill',
      amount: Number(formData.get ? formData.get('amount') : formData.amount) || 0,
      date: (formData.get ? formData.get('date') : formData.date) || currentDateStr,
      time: (formData.get ? formData.get('time') : formData.time) || nowTimeStr,
      groupDate,
      updatedDate: isHistorical ? `${currentDateStr} ${nowTimeStr}` : `${groupDate} ${nowTimeStr}`,
      editCount: 0,
      editHistory: [],
    };
    bills.unshift(newBill);
    setLocalData('bill_history', bills);
    return { success: true, data: newBill, isLocal: true };
  }
};

export const updateBillHistory = async (id, formData) => {
  try {
    return await request(`/api/bills/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (err) {
    const bills = getLocalData('bill_history', []);
    const idx = bills.findIndex((b) => b._id === id);
    if (idx !== -1) {
      const existing = bills[idx];
      const prev = {
        billName: existing.billName,
        amount: existing.amount,
        date: existing.date,
        time: existing.time,
        groupDate: existing.groupDate,
      };
      const newBillName = formData.get ? (formData.get('billName') || existing.billName) : (formData.billName || existing.billName);
      const newAmount = Number(formData.get ? formData.get('amount') : formData.amount) || existing.amount;
      const newDate = (formData.get ? formData.get('date') : formData.date) || existing.date;
      const newTime = (formData.get ? formData.get('time') : formData.time) || existing.time;
      const newGroupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || existing.groupDate;

      const now = new Date();
      const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

      const updated = {
        ...existing,
        billName: newBillName,
        amount: newAmount,
        date: newDate,
        time: newTime,
        groupDate: newGroupDate,
        editCount: (existing.editCount || 0) + 1,
        updatedDate: nowTimestamp,
      };

      const updatedValues = {
        billName: updated.billName,
        amount: updated.amount,
        date: updated.date,
        time: updated.time,
        groupDate: updated.groupDate,
      };

      updated.editHistory = Array.isArray(existing.editHistory) ? [...existing.editHistory] : [];
      updated.editHistory.push({
        previousValues: prev,
        updatedValues: updatedValues,
        timestamp: nowTimestamp,
        note: `Updated bill #${updated.editCount}`,
      });
      bills[idx] = updated;
      setLocalData('bill_history', bills);
      return { success: true, data: updated, isLocal: true };
    }
    throw err;
  }
};

export const deleteBillHistory = async (id) => {
  try {
    return await request(`/api/bills/${id}`, { method: 'DELETE' });
  } catch {
    const bills = getLocalData('bill_history', []);
    const filtered = bills.filter((b) => b._id !== id);
    setLocalData('bill_history', filtered);
    return { success: true, id, isLocal: true };
  }
};

export const deleteBillsHistoryByMonth = async (month) => {
  try {
    return await request(`/api/bills/month/${month}`, { method: 'DELETE' });
  } catch {
    const bills = getLocalData('bill_history', []);
    const filtered = bills.filter((b) => !((b.groupDate && b.groupDate.startsWith(month)) || (b.date && b.date.startsWith(month))));
    setLocalData('bill_history', filtered);
    return { success: true, deletedCount: bills.length - filtered.length, isLocal: true };
  }
};

// ==========================================
// 5. DASHBOARD STATS
// ==========================================
export const fetchDashboardStats = async () => {
  try {
    return await request('/api/dashboard/stats');
  } catch {
    const dailyItems = getLocalData('daily_items', []);
    const spendings = getLocalData('spendings', []);
    const bills = getLocalData('today_bills', []);
    const history = getLocalData('bill_history', []);

    const spendingTotal = spendings.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter((b) => b.date === todayStr || b.groupDate === todayStr);
    const todayBillsTotal = todayBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    return {
      success: true,
      data: {
        dailyItemsCount: dailyItems.length,
        spendingTotal: Number(spendingTotal.toFixed(2)),
        todayBillsCount: todayBills.length || bills.length,
        todayBillsTotal: Number(todayBillsTotal.toFixed(2)),
        billsHistoryCount: history.length || bills.length,
        recentActivity: {
          items: dailyItems.slice(0, 3),
          spendings: spendings.slice(0, 3),
          bills: bills.slice(0, 3),
        },
      },
      isLocal: true,
    };
  }
};

// ==========================================
// 6. ADMIN CREDENTIALS
// ==========================================
export const updateAdminCredentials = async ({ currentPassword, newUsername, newPassword }) => {
  return await request('/api/admin/change-credentials', {
    method: 'PUT',
    body: { currentPassword, newUsername, newPassword },
  });
};

// ==========================================
// 7. DAILY NOTES
// ==========================================
export const getNotes = async ({ search = '', date = '', month = '', sort = 'latest' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (date) params.append('date', date);
  if (month) params.append('month', month);
  if (sort) params.append('sort', sort);

  try {
    return await request(`/api/notes?${params.toString()}`);
  } catch {
    const todayStr = new Date().toISOString().split('T')[0];
    let notes = getLocalData('daily_notes', [
      {
        _id: 'seed-note-1',
        title: 'Morning Shift Handover & Stock Audit',
        content: 'Completed milk and coffee beans check. Espresso bean grinder adjusted to grind size #4 for morning humidity. Cash drawer balance verified at ₹3,500.',
        category: 'Staff',
        date: todayStr,
        time: '08:15:00',
        groupDate: todayStr,
        updatedDate: `${todayStr} 08:15:00`,
        editCount: 0,
        editHistory: [],
      },
      {
        _id: 'seed-note-2',
        title: 'Espresso Machine Filter & Steam Wand Descaling',
        content: 'Descaled steam wands and backflushed group head 1 & 2 with cafiza detergent solution. Pressure holding steady at 9.2 bars.',
        category: 'Maintenance',
        date: todayStr,
        time: '14:30:00',
        groupDate: todayStr,
        updatedDate: `${todayStr} 14:30:00`,
        editCount: 1,
        editHistory: [
          {
            previousValues: { content: 'Backflushed group head 1 with detergent.' },
            updatedValues: { content: 'Descaled steam wands and backflushed group head 1 & 2 with cafiza detergent solution. Pressure holding steady at 9.2 bars.' },
            timestamp: `${todayStr} 14:45:00`,
            note: 'Updated maintenance details for both group heads',
          },
        ],
      },
      {
        _id: 'seed-note-3',
        title: 'Supplier Delivery Delay Note',
        content: 'Dairy supplier notified milk delivery will be 30 minutes late tomorrow morning due to road construction on MG Road.',
        category: 'Inventory',
        date: '2026-07-28',
        time: '16:00:00',
        groupDate: '2026-07-28',
        updatedDate: '2026-07-28 16:00:00',
        editCount: 0,
        editHistory: [],
      },
    ]);

    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q)) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }
    if (date) {
      notes = notes.filter((n) => n.date === date || n.groupDate === date);
    }
    if (month) {
      notes = notes.filter((n) => (n.groupDate || n.date).startsWith(month));
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    notes.sort((a, b) => {
      const dateA = a.groupDate || a.date;
      const dateB = b.groupDate || b.date;
      return sortOrder === 1 ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

    let todayNotesCount = 0;
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

    return {
      success: true,
      count: notes.length,
      todayNotesCount,
      data: Object.values(groupsMap),
      allItems: notes,
      isLocal: true,
    };
  }
};

export const createNote = async (formData) => {
  try {
    return await request('/api/notes', {
      method: 'POST',
      body: formData,
    });
  } catch {
    const notes = getLocalData('daily_notes', []);
    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowTimestamp = `${currentDateStr} ${currentTimeStr}`;

    const noteDate = (formData.get ? formData.get('date') : formData.date) || currentDateStr;
    const noteTime = (formData.get ? formData.get('time') : formData.time) || currentTimeStr;
    const groupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || noteDate;

    const isHistorical = groupDate && groupDate !== currentDateStr;
    const effectiveUpdatedDate = isHistorical ? nowTimestamp : `${noteDate} ${noteTime}`;

    const newNote = {
      _id: 'note-' + Date.now(),
      title: (formData.get ? formData.get('title') : formData.title) || 'General Note',
      content: (formData.get ? formData.get('content') : formData.content) || '',
      category: (formData.get ? formData.get('category') : formData.category) || 'General',
      date: noteDate,
      time: noteTime,
      groupDate,
      updatedDate: effectiveUpdatedDate,
      editCount: 0,
      editHistory: [],
    };

    notes.unshift(newNote);
    setLocalData('daily_notes', notes);
    return { success: true, data: newNote, isLocal: true };
  }
};

export const updateNote = async (id, formData) => {
  try {
    return await request(`/api/notes/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (err) {
    const notes = getLocalData('daily_notes', []);
    const idx = notes.findIndex((n) => n._id === id);
    if (idx !== -1) {
      const existing = notes[idx];
      const prev = {
        title: existing.title,
        content: existing.content,
        category: existing.category,
        date: existing.date,
        time: existing.time,
        groupDate: existing.groupDate,
      };

      const newTitle = formData.get ? (formData.get('title') || existing.title) : (formData.title || existing.title);
      const newContent = formData.get ? (formData.get('content') || existing.content) : (formData.content || existing.content);
      const newCategory = formData.get ? (formData.get('category') || existing.category) : (formData.category || existing.category);
      const newDate = (formData.get ? formData.get('date') : formData.date) || existing.date;
      const newTime = (formData.get ? formData.get('time') : formData.time) || existing.time;
      const newGroupDate = (formData.get ? formData.get('groupDate') : formData.groupDate) || existing.groupDate;

      const now = new Date();
      const nowTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

      const updated = {
        ...existing,
        title: newTitle,
        content: newContent,
        category: newCategory,
        date: newDate,
        time: newTime,
        groupDate: newGroupDate,
        editCount: (existing.editCount || 0) + 1,
        updatedDate: nowTimestamp,
      };

      const updatedValues = {
        title: updated.title,
        content: updated.content,
        category: updated.category,
        date: updated.date,
        time: updated.time,
        groupDate: updated.groupDate,
      };

      updated.editHistory = Array.isArray(existing.editHistory) ? [...existing.editHistory] : [];
      updated.editHistory.push({
        previousValues: prev,
        updatedValues: updatedValues,
        timestamp: nowTimestamp,
        note: `Updated note #${updated.editCount}`,
      });

      notes[idx] = updated;
      setLocalData('daily_notes', notes);
      return { success: true, data: updated, isLocal: true };
    }
    throw err;
  }
};

export const deleteNote = async (id) => {
  try {
    return await request(`/api/notes/${id}`, { method: 'DELETE' });
  } catch {
    const notes = getLocalData('daily_notes', []);
    const filtered = notes.filter((n) => n._id !== id);
    setLocalData('daily_notes', filtered);
    return { success: true, id, isLocal: true };
  }
};

export const deleteNotesByMonth = async (month) => {
  try {
    return await request(`/api/notes/month/${month}`, { method: 'DELETE' });
  } catch {
    const notes = getLocalData('daily_notes', []);
    const filtered = notes.filter((n) => !(n.groupDate || n.date).startsWith(month));
    const deletedCount = notes.length - filtered.length;
    setLocalData('daily_notes', filtered);
    return { success: true, deletedCount, isLocal: true };
  }
};


