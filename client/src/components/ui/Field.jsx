// Field: labelled input wrapper that renders an inline error message; Alert shows a status banner.
export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Alert({ tone = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
