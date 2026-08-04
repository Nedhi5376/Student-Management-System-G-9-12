import clsx from 'clsx';

export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={clsx('badge', `badge--${tone}`, className)}>
      {dot ? <span className="badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
