import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../lib/axiosInstance.js';
import { BrandMark } from './BrandMark.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

export function AuthShell({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    api
      .get('/health')
      .then(() => active && setStatus('ok'))
      .catch(() => active && setStatus('down'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <BrandMark />
      </div>
      <div className="w-full max-w-[400px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'ok'
              ? 'bg-success-400 shadow-[0_0_0_3px_rgba(22,163,74,0.2)]'
              : status === 'down'
                ? 'bg-danger-400'
                : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
        {status === 'ok' ? (
          <>
            <Check size={13} aria-hidden="true" />
            System operational
          </>
        ) : status === 'down' ? (
          'Service unreachable'
        ) : (
          'Checking service status…'
        )}
      </div>
    </div>
  );
}