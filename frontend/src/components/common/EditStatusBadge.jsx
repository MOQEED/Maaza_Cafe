import React from 'react';

/**
 * Formats a raw timestamp (ISO, "YYYY-MM-DD HH:mm:ss", etc.) into:
 * "10 Jul 2026, 08:58 pm" or "08 Sept 2026, 06:30 pm"
 * matching the user's reference in Image 1.
 */
function formatBadgeTimestamp(input) {
  if (!input) return '';
  try {
    const trimmed = String(input).trim();
    // If already formatted like "10 Jul 2026, 08:58 pm", return it directly
    if (/^\d{1,2}\s+[A-Za-z]{3,4}\s+\d{4},\s+\d{1,2}:\d{2}\s*(am|pm)$/i.test(trimmed)) {
      return trimmed;
    }

    let d;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split(/[\sT]+/);
      const dateParts = parts[0].split('-').map(Number);
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':').map(Number);
        hours = timeParts[0] || 0;
        minutes = timeParts[1] || 0;
        seconds = timeParts[2] || 0;
      }
      d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, seconds);
    } else {
      d = new Date(trimmed);
    }

    if (isNaN(d.getTime())) {
      return trimmed;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    const strMinutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${strHours}:${strMinutes} ${ampm}`;
  } catch {
    return String(input);
  }
}

/**
 * EditStatusBadge - Displays "Edited {N}× • {Date, Time}"
 * Rendered below Edit & Delete buttons in the table Actions column.
 */
export default function EditStatusBadge({ editCount = 0, lastEdited, onClick, className = '' }) {
  if (!editCount || editCount <= 0) {
    return null;
  }

  const formattedTime = formatBadgeTimestamp(lastEdited);

  return (
    <button
      onClick={onClick}
      type="button"
      title="Click to view change history"
      className={`btn-edit-badge ${className}`}
    >
      <span>Edited {editCount}×</span>
      {formattedTime && (
        <>
          <span className="opacity-60">•</span>
          <span>{formattedTime}</span>
        </>
      )}
    </button>
  );
}
