import { TriangleAlert } from 'lucide-react';

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
        <TriangleAlert size={22} aria-hidden="true" />
      </span>
      <p className="max-w-md text-[13.5px] text-slate-600 dark:text-slate-300">
        {message ?? 'Something went wrong while loading this data.'}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}