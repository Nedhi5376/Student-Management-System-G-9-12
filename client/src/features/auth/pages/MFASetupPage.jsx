import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaDisableSchema, totpOnlySchema } from '../schemas/auth.schemas.js';
import { useMfa } from '../hooks/useMfa.js';
import { Alert, Field } from '../../../components/ui/Field.jsx';

function EnableFlow() {
  const { qrDataUrl, otpauthUrl, backupCodes, error, busy, startSetup, enable } = useMfa();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(totpOnlySchema) });

  if (backupCodes) {
    return (
      <section className="card">
        <h2>Save your backup codes</h2>
        <p className="muted">Each code works once. Store them somewhere safe — they are shown only now.</p>
        <ul className="codes">
          {backupCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (!qrDataUrl) {
    return (
      <section className="card">
        <h2>Enable two-factor authentication</h2>
        <Alert>{error}</Alert>
        <button type="button" onClick={startSetup} disabled={busy}>
          {busy ? 'Generating…' : 'Start setup'}
        </button>
      </section>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit(({ code }) => enable(code))} noValidate>
      <h2>Scan the QR code</h2>
      <img className="qr" src={qrDataUrl} alt="MFA QR code" />
      <p className="muted">Can’t scan? Use this setup key: {new URL(otpauthUrl).searchParams.get('secret')}</p>
      <Alert>{error}</Alert>
      <Field label="Enter the 6-digit code" error={errors.code?.message}>
        <input type="text" inputMode="numeric" autoComplete="one-time-code" {...register('code')} />
      </Field>
      <button type="submit" disabled={busy}>
        {busy ? 'Verifying…' : 'Enable MFA'}
      </button>
    </form>
  );
}

function DisableFlow() {
  const { error, busy, disable } = useMfa();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(mfaDisableSchema) });

  return (
    <form className="card" onSubmit={handleSubmit((values) => disable(values))} noValidate>
      <h2>Disable two-factor authentication</h2>
      <Alert>{error}</Alert>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="current-password" {...register('password')} />
      </Field>
      <Field label="Current 6-digit code" error={errors.code?.message}>
        <input type="text" inputMode="numeric" autoComplete="one-time-code" {...register('code')} />
      </Field>
      <button type="submit" disabled={busy}>
        {busy ? 'Disabling…' : 'Disable MFA'}
      </button>
    </form>
  );
}

export function MFASetupPage() {
  const { mfaEnabled } = useMfa();
  return <main className="page">{mfaEnabled ? <DisableFlow /> : <EnableFlow />}</main>;
}
