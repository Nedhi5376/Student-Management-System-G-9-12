import { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  { className, error, disabled, children, label, required, hint, ...props },
  ref,
) {
  const id = props.id ?? props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
          {required ? <span className="ml-0.5 text-red-600 dark:text-red-400">*</span> : null}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`
          w-full rounded-lg border bg-white dark:bg-slate-900
          text-slate-900 dark:text-white
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          pl-4 pr-10 py-2.5 text-[13.5px] appearance-none
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")]
          bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat
          ${error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
          ${className ?? ''}
        `.trim()}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';