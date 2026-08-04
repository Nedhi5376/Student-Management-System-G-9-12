import clsx from 'clsx';

const PALETTE = [
  ['#4f46e5', '#eef2ff'],
  ['#0e9f6e', '#ecfdf5'],
  ['#b45309', '#fffbeb'],
  ['#0d7490', '#ecfeff'],
  ['#be185d', '#fdf2f8'],
  ['#4338ca', '#eef2ff'],
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