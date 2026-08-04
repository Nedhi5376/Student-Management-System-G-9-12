export function Field({ label, required, hint, error, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
        {label}
        {required ? <span className="ml-0.5 text-red-600 dark:text-red-400">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span> : null}
      {error ? (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}