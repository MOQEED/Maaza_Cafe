import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArchive,
  FiLock,
  FiLogIn,
  FiPlus,
  FiCalendar,
  FiClock,
  FiRotateCcw,
} from 'react-icons/fi';
import { MdCalendarMonth } from 'react-icons/md';
import { ClipLoader } from 'react-spinners';
import confetti from 'canvas-confetti';
import {
  fetchBillsHistory,
  createBillHistory,
  updateBillHistory,
  deleteBillHistory,
  deleteBillsHistoryByMonth,
} from '../services/api';
import { useAuth } from '../context/useAuth';
import { useAutoDateTime } from '../hooks/useAutoDateTime';
import { exportToPDF, exportMonthlyPDF } from '../utils/exportUtils';
import TableToolbar from '../components/common/TableToolbar';
import DateCart from '../components/DateCart';
import ChangeHistoryModal from '../components/common/ChangeHistoryModal';
import ImagePreview from '../components/common/ImagePreview';
import ToastNotification from '../components/common/ToastNotification';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import DeleteMonthModal from '../components/DeleteMonthModal';
import ReceiptModal from '../components/ReceiptModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BillsHistory() {
  const { isAuth } = useAuth();
  const autoDateTime = useAutoDateTime();
  const fileInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Data states
  const [groupedData, setGroupedData] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showOnlyToday, setShowOnlyToday] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [targetGroupDate, setTargetGroupDate] = useState(null);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [formValues, setFormValues] = useState({
    billName: '',
    amount: '',
    date: autoDateTime.date,
    time: autoDateTime.time,
  });
  const [imageFile, setImageFile] = useState(null);

  // Modals & Feedback
  const [previewImage, setPreviewImage] = useState({ open: false, src: '', title: '' });
  const [historyModal, setHistoryModal] = useState({ open: false, item: null });
  const [receiptModal, setReceiptModal] = useState({ open: false, bill: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [deleteMonthModal, setDeleteMonthModal] = useState({ open: false, month: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);

  // Load Bills History
  const loadData = useCallback(async () => {
    if (!isAuth) return;
    setLoading(true);
    try {
      const res = await fetchBillsHistory({ search, date: filterDate, month: filterMonth, sort: 'latest' });
      if (res.success) {
        setGroupedData(res.data || []);
        setAllBills(res.allBills || []);
        setGrandTotal(res.grandTotal || 0);
        const todayGrp = (res.data || []).find((g) => g.date === todayStr);
        setTodayTotal(todayGrp ? Number(todayGrp.total) : (Number(res.todayTotal) || 0));
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load bill history: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuth, search, filterDate, filterMonth, todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isEditing && !targetGroupDate && !isCustomDate) {
      setFormValues((prev) => ({
        ...prev,
        date: autoDateTime.date,
        time: autoDateTime.time,
      }));
    }
  }, [autoDateTime.date, autoDateTime.time, isEditing, targetGroupDate, isCustomDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date') {
      setIsCustomDate(true);
      if (value && value !== todayStr) {
        setTargetGroupDate(value);
      } else {
        setTargetGroupDate(null);
      }
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTargetGroupDate(null);
    setIsCustomDate(false);
    setFormValues({
      billName: '',
      amount: '',
      date: autoDateTime.date,
      time: autoDateTime.time,
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.billName.trim() || !formValues.amount) {
      setToast({ message: 'Bill name and amount are required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('billName', formValues.billName.trim());
      formData.append('amount', formValues.amount);
      formData.append('date', formValues.date || autoDateTime.date);
      formData.append('time', formValues.time || autoDateTime.time);

      const effectiveGroupDate = targetGroupDate || formValues.date || autoDateTime.date;
      formData.append('groupDate', effectiveGroupDate);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditing) {
        const res = await updateBillHistory(editId, formData);
        if (res.success) {
          setToast({ message: `Bill "${formValues.billName}" updated in archive!`, type: 'success' });
          resetForm();
          loadData();
        }
      } else {
        const res = await createBillHistory(formData);
        if (res.success) {
          setToast({ message: `Bill "${formValues.billName}" saved to ${effectiveGroupDate} history archive!`, type: 'success' });
          try {
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
          } catch {
            // Ignore confetti fallback
          }
          resetForm();
          loadData();
        }
      }
    } catch (err) {
      setToast({ message: 'Save error: ' + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setIsEditing(true);
    setEditId(item._id || item.id);
    setTargetGroupDate(item.groupDate || item.date);
    setIsCustomDate(true);
    setFormValues({
      billName: item.billName,
      amount: item.amount,
      date: item.date,
      time: item.time,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAddForDate = (dateForAdd) => {
    setIsEditing(false);
    setEditId(null);
    setTargetGroupDate(dateForAdd);
    setIsCustomDate(true);
    setFormValues({
      billName: '',
      amount: '',
      date: dateForAdd,
      time: autoDateTime.time,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id, title) => {
    setDeleteModal({ open: true, id, title });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const res = await deleteBillHistory(deleteModal.id);
      if (res.success) {
        setToast({ message: 'Historical bill deleted permanently.', type: 'info' });
        setDeleteModal({ open: false, id: null, title: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // General PDF Export
  const handleGeneralPDF = () => {
    const headers = ['#', 'Date Group', 'Bill Description', 'Amount', 'Date', 'Time', 'Updated Date'];
    const rows = allBills.map((it, idx) => [
      idx + 1,
      it.groupDate || it.date,
      it.billName,
      `Rs. ${Number(it.amount || 0).toLocaleString('en-IN')}`,
      it.date,
      it.time || '',
      it.updatedDate || '-',
    ]);

    exportToPDF({
      title: 'Bills History Audit Statement',
      subtitle: showOnlyToday ? `Today's Records: ${todayStr}` : (filterMonth ? `Month: ${filterMonth}` : `All historical dates`),
      headers,
      rows,
      totals: ['Grand Total', '', '', `Rs. ${grandTotal.toLocaleString('en-IN')}`, '', '', ''],
      fileName: `maaza-bills-history-${filterMonth || (showOnlyToday ? todayStr : 'all')}.pdf`,
    });
  };

  // Monthly PDF Export
  const handleMonthlyPDF = () => {
    const effectiveMonth = filterMonth || (displayedGroups[0]?.date ? displayedGroups[0].date.slice(0, 7) : todayStr.slice(0, 7));
    const monthGroups = groupedData.filter((g) => g.date.startsWith(effectiveMonth));
    const targetGroups = monthGroups.length > 0 ? monthGroups : displayedGroups;
    const monthGrandTotal = targetGroups.reduce((sum, g) => sum + (Number(g.total) || 0), 0);

    exportMonthlyPDF({
      monthString: effectiveMonth,
      pageTitle: 'Bills History Monthly Audit',
      groupedData: targetGroups,
      grandTotal: monthGrandTotal,
      fileName: `maaza-bills-history-month-${effectiveMonth}.pdf`,
    });
  };

  // Delete Month Handler
  const confirmDeleteMonth = (targetMonth) => {
    const m = typeof targetMonth === 'string' && targetMonth ? targetMonth : filterMonth;
    setDeleteMonthModal({ open: true, month: m || '' });
  };

  const executeDeleteMonth = async (monthToDelete) => {
    const m = monthToDelete || deleteMonthModal.month;
    if (!m) return;
    setDeletingMonth(true);
    try {
      const res = await deleteBillsHistoryByMonth(m);
      if (res.success) {
        setToast({ message: `Deleted all ${res.deletedCount || ''} bill records for month ${m}.`, type: 'info' });
        setDeleteMonthModal({ open: false, month: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete month data: ' + err.message, type: 'error' });
    } finally {
      setDeletingMonth(false);
    }
  };

  // Filter carts
  let displayedGroups = groupedData;
  if (filterDate) {
    displayedGroups = groupedData.filter((g) => g.date === filterDate);
    if (displayedGroups.length === 0) {
      displayedGroups = [{ date: filterDate, items: [], total: 0 }];
    }
  } else if (filterMonth) {
    displayedGroups = groupedData.filter((g) => g.date.startsWith(filterMonth));
  } else if (showOnlyToday) {
    displayedGroups = groupedData.filter((g) => g.date === todayStr);
    if (displayedGroups.length === 0) {
      displayedGroups = [{ date: todayStr, items: [], total: 0 }];
    }
  }

  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <FiLock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            Bills History is Protected
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manager or Owner authentication is required to access historical customer orders and financial audit logs.
          </p>
        </div>
        <Link
          to="/login"
          className="btn-green w-full py-2.5 text-sm justify-center gap-2 flex items-center"
        >
          <FiLogIn className="w-4 h-4" />
          <span>Login to Access Bills History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 space-y-8 animate-fade-in">
      {/* Toast Alert */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Lightbox, History, Delete & Receipt Modals */}
      <ImagePreview
        isOpen={previewImage.open}
        onClose={() => setPreviewImage({ open: false, src: '', title: '' })}
        src={previewImage.src}
        title={previewImage.title}
      />
      <ChangeHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, item: null })}
        item={historyModal.item}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: '' })}
        onConfirm={executeDelete}
        itemName={deleteModal.title}
        loading={deleting}
      />
      <DeleteMonthModal
        isOpen={deleteMonthModal.open}
        onClose={() => setDeleteMonthModal({ open: false, month: '' })}
        onConfirm={executeDeleteMonth}
        initialMonth={deleteMonthModal.month}
        items={allBills}
        pageTitle="Bills History"
        loading={deletingMonth}
      />
      <ReceiptModal
        isOpen={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, bill: null })}
        bill={receiptModal.bill}
      />

      {/* Top Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <FiArchive className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Bills History
        </h1>
      </div>

      {/* Adding for previous date badge */}
      {targetGroupDate && !isEditing && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Adding bill to historical cart: <strong>{targetGroupDate}</strong> (Current date & time recorded in Updated Date)</span>
          </div>
          <button
            onClick={() => {
              setTargetGroupDate(null);
              setIsCustomDate(false);
              setFormValues((prev) => ({ ...prev, date: autoDateTime.date }));
            }}
            className="font-bold underline text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
          >
            Cancel (Use Today's Date)
          </button>
        </div>
      )}

      {/* Card 1: Form Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Bill Name & Bill Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Bill Name / Order Item <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="billName"
                value={formValues.billName}
                onChange={handleInputChange}
                required
                className="form-input-box"
                placeholder="e.g. Table 4 Dinner Order"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Bill Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                name="amount"
                value={formValues.amount}
                onChange={handleInputChange}
                required
                className="form-input-box"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 2: Date & Time (Auto-filled) + Upload Bill Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Date & Time <span className="text-stone-400 font-normal">(Auto-filled)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Date pill */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/60 text-xs">
                  <FiCalendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-stone-400 block -mb-0.5">Date</span>
                    <input
                      type="date"
                      name="date"
                      value={formValues.date}
                      onChange={handleInputChange}
                      className="bg-transparent border-none p-0 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none w-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Time pill */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/60 text-xs">
                  <FiClock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-stone-400 block -mb-0.5">Time</span>
                    <input
                      type="text"
                      name="time"
                      value={formValues.time}
                      onChange={handleInputChange}
                      className="bg-transparent border-none p-0 text-xs font-bold font-mono text-stone-800 dark:text-stone-200 focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Bill Image */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Upload Bill Image
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="form-input-box py-2 text-xs"
              />
            </div>
          </div>

          {/* Row 3: + Save (Green) and Reset (White) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="btn-green active:scale-95 px-5 py-2.5 text-xs font-bold shadow-xs gap-1.5 flex items-center cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <ClipLoader size={14} color="#ffffff" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditing ? 'Update Bill' : '+ Save'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="btn-white active:scale-95 px-4 py-2.5 text-xs font-bold gap-1.5 flex items-center cursor-pointer"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Filter Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        date={filterDate}
        onDateChange={(newDate) => {
          setFilterDate(newDate);
          if (newDate) setShowOnlyToday(false);
        }}
        month={filterMonth}
        onMonthChange={(newMonth) => {
          setFilterMonth(newMonth);
          if (newMonth) setShowOnlyToday(false);
        }}
        showOnlyToday={showOnlyToday}
        onToggleOnlyToday={() => {
          setShowOnlyToday(!showOnlyToday);
          setFilterDate('');
          setFilterMonth('');
        }}
        onExportPDF={handleGeneralPDF}
        onExportMonthlyPDF={handleMonthlyPDF}
        onDeleteMonth={confirmDeleteMonth}
        onAddForDate={startAddForDate}
        onReset={() => {
          setSearch('');
          setFilterDate('');
          setFilterMonth('');
          setShowOnlyToday(true);
        }}
      />

      {/* Notice if viewing only today */}
      {showOnlyToday && !filterDate && !filterMonth && (
        <div className="flex items-center justify-between text-xs px-2 text-stone-500 dark:text-stone-400">
          <span>Showing only <strong>Today's Cart ({todayStr})</strong></span>
          <button
            onClick={() => setShowOnlyToday(false)}
            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MdCalendarMonth className="w-3.5 h-3.5" />
            <span>Click to view previous dates data</span>
          </button>
        </div>
      )}

      {/* Card 3: Date Carts */}
      <div id="bills-history-carts-container" className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <LoadingSpinner message="Loading bills history..." />
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            No bills found in archive. Use the form above to add an order.
          </div>
        ) : (
          displayedGroups.map((group) => (
            <DateCart
              key={group.date}
              date={group.date}
              items={group.items}
              total={group.total}
              onAddForDate={startAddForDate}
              onEdit={startEdit}
              onDelete={confirmDelete}
              onImageClick={(src, title) => setPreviewImage({ open: true, src, title })}
              onHistoryClick={(it) => setHistoryModal({ open: true, item: it })}
              onReceiptClick={(bill) => setReceiptModal({ open: true, bill })}
              isBill={true}
              cartIdPrefix="history-cart"
            />
          ))
        )}
      </div>

      {/* Card 4: Bottom Banner */}
      <div className="total-banner mt-8">
        Today's Total Bill Amount = ₹{todayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}
