import clsx from 'clsx';

const PALETTE = [
  ['#1d4ed8', '#eff6ff'],
  ['#0f172a', '#eef2f7'],
  ['#0284c7', '#e0f2fe'],
  ['#16a34a', '#f0fdf4'],
  ['#b45309', '#fffbeb'],
  ['#475569', '#f1f5f9'],
];

function initialsOf(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const SIZES = {
  sm: 'h-[30px] w-[30px] text-xs',
  md: 'h-10 w-10 text-[15px]',
  lg: 'h-14 w-14 text-xl',
};

export function Avatar({ name, size = 'md', className }) {
  const index = name.length % PALETTE.length;
  const [fg, bg] = PALETTE[index];
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none', SIZES[size], className)}
      style={{ backgroundColor: bg, color: fg }}
      aria-hidden="true"
    >
      {initialsOf(name) || '?'}
    </span>
  );
}