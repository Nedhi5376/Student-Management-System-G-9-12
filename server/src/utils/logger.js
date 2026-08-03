const REDACTED_KEYS = /pass|token|secret|code|otp|authorization|cookie/i;

function redact(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [key, REDACTED_KEYS.test(key) ? '[redacted]' : redact(val)]),
  );
}

function emit(level, message, meta) {
  const entry = { level, message, time: new Date().toISOString(), ...(meta ? redact(meta) : {}) };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export const logger = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
  /** Auth audit trail: never receives credentials, only identifiers and outcomes. */
  auth: (event, meta) => emit('info', `auth.${event}`, meta),
};
