import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCreditCard,
  FiPlus,
  FiCalendar,
  FiClock,
  FiRotateCcw,
  FiLock,
  FiLogIn,
} from 'react-icons/fi';
import { MdCalendarMonth } from 'react-icons/md';
import { ClipLoader } from 'react-spinners';
import {
  fetchSpending,
  createSpending,
  updateSpending,
  deleteSpending,
  deleteSpendingByMonth,
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
import LoadingSpinner from '../components/LoadingSpinner';

export default function Spending() {
  const { isAuth } = useAuth();
  const autoDateTime = useAutoDateTime();
  const fileInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Data states
  const [groupedData, setGroupedData] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [todaySpending, setTodaySpending] = useState(0);

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
    itemName: '',
    quantity: '',
    price: '',
    date: autoDateTime.date,
    time: autoDateTime.time,
  });
  const [imageFile, setImageFile] = useState(null);

  // Modals & Feedback
  const [previewImage, setPreviewImage] = useState({ open: false, src: '', title: '' });
  const [historyModal, setHistoryModal] = useState({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [deleteMonthModal, setDeleteMonthModal] = useState({ open: false, month: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);

  // Load Spending
  const loadData = useCallback(async () => {
    if (!isAuth) return;
    setLoading(true);
    try {
      const res = await fetchSpending({ search, date: filterDate, month: filterMonth, sort: 'latest' });
      if (res.success) {
        setGroupedData(res.data || []);
        setAllItems(res.allItems || []);
        setTotalSpending(res.totalSpending || 0);
        setTodaySpending(res.todaySpending || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load spending: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuth, search, filterDate, filterMonth]);

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
      itemName: '',
      quantity: '',
      price: '',
      date: autoDateTime.date,
      time: autoDateTime.time,
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.itemName.trim() || !formValues.quantity || !formValues.price) {
      setToast({ message: 'Item name, quantity, and price are required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('itemName', formValues.itemName.trim());
      formData.append('quantity', formValues.quantity);
      formData.append('price', formValues.price);
      formData.append('date', formValues.date || autoDateTime.date);
      formData.append('time', formValues.time || autoDateTime.time);

      const effectiveGroupDate = targetGroupDate || formValues.date || autoDateTime.date;
      formData.append('groupDate', effectiveGroupDate);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditing) {
        const res = await updateSpending(editId, formData);
        if (res.success) {
          setToast({ message: `"${formValues.itemName}" updated successfully!`, type: 'success' });
          resetForm();
          loadData();
        }
      } else {
        const res = await createSpending(formData);
        if (res.success) {
          setToast({ message: `"${formValues.itemName}" recorded in spending ledger for ${effectiveGroupDate}!`, type: 'success' });
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
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
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
      itemName: '',
      quantity: '',
      price: '',
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
      const res = await deleteSpending(deleteModal.id);
      if (res.success) {
        setToast({ message: 'Spending record deleted permanently.', type: 'info' });
        setDeleteModal({ open: false, id: null, title: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Filter groups
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

  // General PDF Export
  const handleGeneralPDF = () => {
    const headers = ['#', 'Date Group', 'Item Name', 'Qty', 'Price', 'Total Price', 'Recorded Time', 'Updated'];
    const rows = allItems.map((it, idx) => [
      idx + 1,
      it.groupDate || it.date,
      it.itemName,
      it.quantity,
      `Rs. ${it.price}`,
      `Rs. ${it.totalPrice}`,
      `${it.date} ${it.time || ''}`,
      it.updatedDate || '-',
    ]);

    exportToPDF({
      title: 'Spending Money Statement',
      subtitle: showOnlyToday ? `Today's Records: ${todayStr}` : (filterMonth ? `Month: ${filterMonth}` : `All dates registered`),
      headers,
      rows,
      totals: ['Total Spending', '', '', '', '', `Rs. ${totalSpending.toLocaleString('en-IN')}`, '', ''],
      fileName: `maaza-spending-${filterMonth || (showOnlyToday ? todayStr : 'all')}.pdf`,
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
      pageTitle: 'Spending Money Monthly Statement',
      groupedData: targetGroups,
      grandTotal: monthGrandTotal,
      fileName: `maaza-spending-month-${effectiveMonth}.pdf`,
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
      const res = await deleteSpendingByMonth(m);
      if (res.success) {
        setToast({ message: `Deleted all ${res.deletedCount || ''} spending records for month ${m}.`, type: 'info' });
        setDeleteMonthModal({ open: false, month: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete month: ' + err.message, type: 'error' });
    } finally {
      setDeletingMonth(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <FiLock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            Spending Money is Protected
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manager or Owner authentication is required to access the spending ledger.
          </p>
        </div>
        <Link
          to="/login"
          className="btn-green w-full py-2.5 text-sm justify-center gap-2 flex items-center"
        >
          <FiLogIn className="w-4 h-4" />
          <span>Login with default admin</span>
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

      {/* Lightbox, History & Delete Modals */}
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
        items={allItems}
        pageTitle="Spending Money"
        loading={deletingMonth}
      />

      {/* Top Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
          <FiCreditCard className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Spending Money
        </h1>
      </div>

      {/* Adding for previous date badge */}
      {targetGroupDate && !isEditing && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Adding expense for historical date: <strong>{targetGroupDate}</strong> (Present date & time recorded in Updated Date)</span>
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
          {/* Row 1: Item Name, Quantity, Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="itemName"
                value={formValues.itemName}
                onChange={handleInputChange}
                required
                className="form-input-box"
                placeholder="e.g. Milk & Dairy Expense"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                name="quantity"
                value={formValues.quantity}
                onChange={handleInputChange}
                required
                className="form-input-box"
                placeholder="1"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Price (₹) <span className="text-rose-500">*</span>
                </label>
                {formValues.quantity && formValues.price ? (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Total: ₹{(Number(formValues.quantity || 0) * Number(formValues.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ) : null}
              </div>
              <input
                type="number"
                step="any"
                name="price"
                value={formValues.price}
                onChange={handleInputChange}
                required
                className="form-input-box"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 2: Date & Time (Auto-filled) + Upload Expense Receipt */}
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

            {/* Upload Receipt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Upload Expense Receipt / Bill
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
                  <span>{isEditing ? 'Update' : '+ Save'}</span>
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
          if (newDate) {
            setFilterMonth('');
            setShowOnlyToday(false);
          }
        }}
        month={filterMonth}
        onMonthChange={(newMonth) => {
          setFilterMonth(newMonth);
          if (newMonth) {
            setFilterDate('');
            setShowOnlyToday(false);
          }
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
      {showOnlyToday && !filterDate && (
        <div className="flex items-center justify-between text-xs px-2 text-stone-500 dark:text-stone-400">
          <span>Showing only <strong>Today's Spending Cart ({todayStr})</strong></span>
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
      <div id="spending-carts-container" className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <LoadingSpinner message="Loading spending ledger..." />
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            No spending records found. Use the form above to add an expense.
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
              cartIdPrefix="spending-cart"
            />
          ))
        )}
      </div>

      {/* Card 4: Bottom Banner */}
      <div className="total-banner mt-8">
        Today's Total Spending Money = ₹{todaySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}
