import { Shield } from 'lucide-react';

export function BrandMark({ onDark = false, subtitle = 'Identity & Access Platform' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
        <Shield size={17} aria-hidden="true" />
      </span>
      <span className="text-left">
        <span className={`block text-[15px] leading-tight font-semibold ${onDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          Student Management System G-9-12
        </span>
        <span className={`block text-[11px] leading-tight ${onDark ? 'text-slate-400' : 'text-slate-400'}`}>
          {subtitle}
        </span>
      </span>
    </span>
  );
}