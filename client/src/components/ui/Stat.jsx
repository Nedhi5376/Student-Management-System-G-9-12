export function Stat({ label, value, icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400',
    amber: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
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