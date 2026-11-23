import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiBookOpen,
  FiPlus,
  FiCalendar,
  FiClock,
  FiRotateCcw,
  FiTag,
  FiAlertCircle,
} from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteNotesByMonth,
  getImageUrl,
} from '../services/api';
import { useAutoDateTime } from '../hooks/useAutoDateTime';
import { exportToPDF, exportMonthlyPDF } from '../utils/exportUtils';
import TableToolbar from '../components/common/TableToolbar';
import NoteDateCard from '../components/NoteDateCard';
import ChangeHistoryModal from '../components/common/ChangeHistoryModal';
import ImagePreview from '../components/common/ImagePreview';
import ToastNotification from '../components/common/ToastNotification';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import DeleteMonthModal from '../components/DeleteMonthModal';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = [
  'General',
  'Kitchen',
  'Staff',
  'Inventory',
  'Maintenance',
  'Important',
];

export default function Notes() {
  const autoDateTime = useAutoDateTime();
  const fileInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Data states
  const [groupedData, setGroupedData] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayNotesCount, setTodayNotesCount] = useState(0);

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
    title: '',
    category: 'General',
    content: '',
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

  // Load notes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotes({
        search,
        date: filterDate,
        month: filterMonth,
      });
      if (res && res.success) {
        setGroupedData(res.data || []);
        setAllNotes(res.allItems || []);
        setTodayNotesCount(res.todayNotesCount || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load notes: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, filterDate, filterMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep date/time synced unless user edited/chose custom date
  useEffect(() => {
    if (!isEditing && !isCustomDate) {
      setFormValues((prev) => ({
        ...prev,
        date: autoDateTime.date,
        time: autoDateTime.time,
      }));
    }
  }, [autoDateTime.date, autoDateTime.time, isEditing, isCustomDate]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTargetGroupDate(null);
    setIsCustomDate(false);
    setFormValues({
      title: '',
      category: 'General',
      content: '',
      date: autoDateTime.date,
      time: autoDateTime.time,
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.title.trim() || !formValues.content.trim()) {
      setToast({ message: 'Both note title and content are required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formValues.title.trim());
      formData.append('category', formValues.category);
      formData.append('content', formValues.content.trim());
      formData.append('date', formValues.date || autoDateTime.date);
      formData.append('time', formValues.time || autoDateTime.time);

      const effectiveGroupDate = targetGroupDate || formValues.date || autoDateTime.date;
      formData.append('groupDate', effectiveGroupDate);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditing) {
        const res = await updateNote(editId, formData);
        if (res.success) {
          setToast({ message: `Note "${formValues.title}" updated successfully!`, type: 'success' });
          resetForm();
          loadData();
        }
      } else {
        const res = await createNote(formData);
        if (res.success) {
          setToast({ message: `Note "${formValues.title}" recorded for ${effectiveGroupDate}!`, type: 'success' });
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

  const startEdit = (note) => {
    setIsEditing(true);
    setEditId(note._id || note.id);
    setTargetGroupDate(note.groupDate || note.date);
    setIsCustomDate(true);
    setFormValues({
      title: note.title,
      category: note.category || 'General',
      content: note.content,
      date: note.date,
      time: note.time,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (contentInputRef.current) contentInputRef.current.focus();
  };

  const startAddForDate = (targetDate) => {
    setIsEditing(false);
    setEditId(null);
    setTargetGroupDate(targetDate);
    setIsCustomDate(true);
    setFormValues({
      title: '',
      category: 'General',
      content: '',
      date: targetDate,
      time: autoDateTime.time,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id, title) => {
    setDeleteModal({ open: true, id, title: title || 'note' });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const res = await deleteNote(deleteModal.id);
      if (res.success) {
        setToast({ message: 'Note permanently deleted.', type: 'info' });
        setDeleteModal({ open: false, id: null, title: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete note: ' + err.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // General PDF Export
  const handleGeneralPDF = () => {
    const headers = ['#', 'Date Group', 'Category', 'Title', 'Content', 'Time', 'Updated'];
    const rows = allNotes.map((n, idx) => [
      idx + 1,
      n.groupDate || n.date,
      n.category || 'General',
      n.title,
      n.content,
      `${n.date} ${n.time || ''}`,
      n.updatedDate || '-',
    ]);

    exportToPDF({
      title: 'Daily Cafe Notes & Shift Handover',
      subtitle: showOnlyToday ? `Today's Notes: ${todayStr}` : (filterMonth ? `Month: ${filterMonth}` : `All dates registered`),
      headers,
      rows,
      totals: ['Total Notes', `${allNotes.length} note(s)`, '', '', '', '', ''],
      fileName: `maaza-notes-${filterMonth || (showOnlyToday ? todayStr : 'all')}.pdf`,
    });
  };

  // Monthly PDF Export
  const handleMonthlyPDF = () => {
    const effectiveMonth = filterMonth || (displayedGroups[0]?.date ? displayedGroups[0].date.slice(0, 7) : todayStr.slice(0, 7));
    const monthGroups = groupedData.filter((g) => g.date.startsWith(effectiveMonth));
    const targetGroups = monthGroups.length > 0 ? monthGroups : displayedGroups;
    const totalMonthNotes = targetGroups.reduce((acc, g) => acc + (g.items?.length || 0), 0);

    exportMonthlyPDF({
      monthString: effectiveMonth,
      pageTitle: 'Monthly Notes Register',
      groupedData: targetGroups,
      grandTotal: totalMonthNotes,
      fileName: `maaza-notes-month-${effectiveMonth}.pdf`,
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
      const res = await deleteNotesByMonth(m);
      if (res && res.success) {
        setToast({ message: `Deleted all ${res.deletedCount || ''} note(s) for month ${m}.`, type: 'info' });
        setDeleteMonthModal({ open: false, month: '' });
        loadData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete month notes: ' + err.message, type: 'error' });
    } finally {
      setDeletingMonth(false);
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
        items={allNotes}
        pageTitle="Daily Notes"
        loading={deletingMonth}
      />

      {/* Top Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
          <FiBookOpen className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Daily Notes & Shift Handover
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Log shift tasks, supplier instructions, maintenance items, and operational notes
          </p>
        </div>
      </div>

      {/* Historical Date Notice */}
      {targetGroupDate && !isEditing && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Adding note to historical cart for: <strong>{targetGroupDate}</strong> (Current date & time recorded in Updated Date)</span>
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

      {/* Form Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Note Title / Task <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formValues.title}
                onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                placeholder="e.g. Milk delivery pending for tomorrow 7 AM"
                className="form-input-box"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <FiTag className="w-3.5 h-3.5 text-stone-400" />
                <span>Category</span>
              </label>
              <select
                value={formValues.category}
                onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                className="form-input-box cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Note Content */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Note Description / Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              ref={contentInputRef}
              rows={3}
              value={formValues.content}
              onChange={(e) => setFormValues({ ...formValues, content: e.target.value })}
              placeholder="Describe shift tasks, supplier notes, machine cleaning instructions, or customer issues..."
              className="form-input-box resize-y"
              required
            />
          </div>

          {/* Row 3: Date, Time & Optional Attachment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Date (Auto-filled / Editable)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formValues.date}
                  onChange={(e) => {
                    setIsCustomDate(true);
                    setFormValues({ ...formValues, date: e.target.value });
                    if (e.target.value !== todayStr) {
                      setTargetGroupDate(e.target.value);
                    }
                  }}
                  className="form-input-box pr-8 cursor-pointer"
                />
                <FiCalendar className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Time Field */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Time (Live clock / Editable)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formValues.time}
                  onChange={(e) => {
                    setIsCustomDate(true);
                    setFormValues({ ...formValues, time: e.target.value });
                  }}
                  className="form-input-box font-mono pr-8"
                  placeholder="HH:mm:ss"
                />
                <FiClock className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Attach Photo / Document (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
                className="form-input-box file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-700 dark:file:text-stone-300 cursor-pointer text-xs"
              />
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-green active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <ClipLoader size={14} color="#ffffff" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditing ? 'Save Changes' : '+ Save Note'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="btn-white active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FiRotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        date={filterDate}
        onDateChange={(d) => {
          setFilterDate(d);
          if (d) setShowOnlyToday(false);
        }}
        month={filterMonth}
        onMonthChange={(m) => {
          setFilterMonth(m);
          if (m) setShowOnlyToday(false);
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

      {/* Notes Date Carts */}
      <div id="daily-notes-container" className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <LoadingSpinner message="Loading notes archives..." />
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            No notes found. Use the form above to write a note.
          </div>
        ) : (
          displayedGroups.map((group) => (
            <NoteDateCard
              key={group.date}
              date={group.date}
              notes={group.items}
              onAddForDate={startAddForDate}
              onEdit={startEdit}
              onDelete={confirmDelete}
              onImageClick={(src, title) => setPreviewImage({ open: true, src: getImageUrl(src), title })}
              onHistoryClick={(note) => setHistoryModal({ open: true, item: note })}
              cartIdPrefix="note-cart"
            />
          ))
        )}
      </div>

      {/* Bottom Summary Banner */}
      <div className="total-banner mt-8">
        Today's Total Recorded Notes = {todayNotesCount} {todayNotesCount === 1 ? 'note' : 'notes'}
      </div>
    </div>
  );
}
