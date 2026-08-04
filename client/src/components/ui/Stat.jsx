export function Stat({ label, value, icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  };
  return (
    <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {icon ? (
        <span className={`inline-flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          {icon}
        </span>
      ) : null}
      <div>
        <div className="text-2xl leading-tight font-bold tracking-tight">{value}</div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </section>
  );
}