import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { className, icon, error, disabled, ...props },
  ref,
) {
  const id = props.id ?? props.name;

  return (
    <div className="w-full">
      {props.label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {props.label}
          {props.required ? <span className="ml-0.5 text-red-600 dark:text-red-400">*</span> : null}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full rounded-lg border bg-white dark:bg-slate-900
            text-slate-900 dark:text-white placeholder:text-slate-400
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-[13.5px]
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
            ${className ?? ''}
          `.trim()}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {props.hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{props.hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';