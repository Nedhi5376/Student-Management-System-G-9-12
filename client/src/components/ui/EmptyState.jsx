export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      {icon ? <span className="text-slate-400 dark:text-slate-500">{icon}</span> : null}
      <span className="text-sm font-semibold">{title}</span>
      {description ? <p className="max-w-md text-[13px] text-slate-500 dark:text-slate-400">{description}</p> : null}
    </div>
  );
}