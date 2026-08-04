import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
