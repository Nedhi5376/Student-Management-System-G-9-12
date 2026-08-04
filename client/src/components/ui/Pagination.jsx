import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

function pageWindow(page, totalPages) {
  const pages = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages, Math.max(page + 2, start + 4));
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function Pagination({ page, total, limit, onPageChange, onLimitChange, limits = [10, 20, 50] }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
<span className="text-[13px] text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-700 dark:text-slate-200">{from}</strong>–<strong className="text-slate-700 dark:text-slate-200">{to}</strong>{' '}
          of <strong className="text-slate-700 dark:text-slate-200">{total}</strong> accounts
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
            Rows
            <select className="input input--sm" value={limit} onChange={(event) => onLimitChange(Number(event.target.value))}>
              {limits.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button
              type="button"
              className="pager-btn"
              disabled={safePage <= 1}
              onClick={() => onPageChange(1)}
              aria-label="First page"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              type="button"
              className="pager-btn"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            {pageWindow(safePage, totalPages).map((value) => (
              <button
                key={value}
                type="button"
                className={clsx('pager-btn', value === safePage && 'is-active')}
                onClick={() => onPageChange(value)}
                aria-current={value === safePage ? 'page' : undefined}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              className="pager-btn"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              className="pager-btn"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight size={15} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}