export function Field({ label, required, hint, error, className, children }) {
  return (
    <label className={`grid gap-1.5 ${className ?? ''}`.trim()}>
      <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
        {label}
        {required ? <span className="ml-0.5 text-danger-600 dark:text-danger-400">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span> : null}
      {error ? (
        <span className="text-xs text-danger-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}