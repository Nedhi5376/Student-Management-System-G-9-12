import clsx from 'clsx';
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from 'lucide-react';

const TONES = {
  error: { Icon: TriangleAlert },
  success: { Icon: CheckCircle2 },
  warning: { Icon: CircleAlert },
  info: { Icon: Info },
};

export function Alert({ tone = 'error', className, children }) {
  if (!children) return null;
  const { Icon } = TONES[tone] ?? TONES.info;
  return (
    <div className={clsx('alert', `alert--${tone}`, className)} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={16} className="alert__icon" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
