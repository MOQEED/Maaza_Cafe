import React from 'react';
import { FiCheck, FiRotateCcw } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

export default function FormButtons({
  onReset,
  submitting = false,
  isEditing = false,
  submitLabel,
  resetLabel = 'Reset',
}) {
  const defaultSubmitText = isEditing ? 'Update Record' : 'Save Record';

  return (
    <div className="flex items-center gap-2.5">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          <span>{resetLabel}</span>
        </button>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
      >
        {submitting ? (
          <>
            <ClipLoader size={14} color="#ffffff" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <FiCheck className="w-4 h-4" />
            <span>{submitLabel || defaultSubmitText}</span>
          </>
        )}
      </button>
    </div>
  );
}
