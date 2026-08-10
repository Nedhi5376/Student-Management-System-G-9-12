export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500 dark:text-slate-400" role="status">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600 dark:border-slate-700" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
