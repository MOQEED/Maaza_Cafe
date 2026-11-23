import React from 'react';

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-stone-400" />}
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-control text-sm ${error ? 'border-rose-400 focus:border-rose-500' : ''}`}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
