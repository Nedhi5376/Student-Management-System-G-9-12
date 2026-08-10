import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Copy, ScanLine, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { mfaDisableSchema, totpOnlySchema } from '../schemas/auth.schemas.js';
import { useMfa } from '../hooks/useMfa.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';

function Steps({ active }) {
  const stages = [
    { key: 'scan', label: 'Scan code' },
    { key: 'backup', label: 'Save codes' },
  ];
  const activeIndex = stages.findIndex((stage) => stage.key === active);
  return (
    <div className="flex items-center gap-3">
      {stages.map((stage, index) => (
        <div key={stage.key} className="flex items-center gap-3">
          <span
            className={`step ${
              index === activeIndex ? 'is-active' : index < activeIndex ? 'is-done' : ''
            }`}
          >
            <span
              className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11.5px] font-semibold ${
                index === activeIndex
                  ? 'bg-primary-600 text-white'
                  : index < activeIndex
                    ? 'bg-success-600 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {index + 1}
            </span>
            {stage.label}
          </span>
          {index < stages.length - 1 ? <span className="h-px w-8 bg-slate-200 dark:bg-slate-700" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function EnableIntro({ startSetup, busy }) {
  return (
    <section className="panel">
      <div className="panel__body flex flex-col items-center gap-3 text-center">
        <span className="status-hero status-hero--info h-14 w-14">
          <ShieldCheck size={26} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold">Protect your account with two-factor authentication</h2>
        <p className="max-w-md text-[13.5px] text-slate-500 dark:text-slate-400">
          After you enable MFA, signing in requires both your password and a 6-digit code from an authenticator app such
          as Google Authenticator, Microsoft Authenticator or 1Password.
        </p>
        <Button onClick={startSetup} loading={busy} className="mt-2">
          <Smartphone size={15} aria-hidden="true" />
          {busy ? 'Generating…' : 'Set up two-factor authentication'}
        </Button>
      </div>
    </section>
  );
}

function EnableScan({ qrDataUrl, otpauthUrl, error, enable, busy }) {
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(totpOnlySchema), mode: 'onTouched' });

  const secret = new URL(otpauthUrl).searchParams.get('secret');

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Scan the QR code</h2>
          <p className="panel__desc">Add this account to your authenticator app, then enter the 6-digit code.</p>
        </div>
        <Badge tone="indigo">Step 1 of 2</Badge>
      </div>
      <div className="panel__body grid gap-5">
        <div className="flex justify-center">
          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <img src={qrDataUrl} alt="QR code to scan in your authenticator app" className="h-44 w-44" />
          </div>
        </div>

        <Field label="Manual setup key">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] tracking-wider dark:border-slate-700 dark:bg-slate-800">
            <span className="min-w-0 flex-1 truncate">{secret}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--icon"
              onClick={copyKey}
              aria-label="Copy setup key"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </Field>

        <Alert>{error}</Alert>

        <form className="grid gap-4" onSubmit={handleSubmit(({ code }) => enable(code))} noValidate>
          <Field label="Enter the 6-digit code" required error={errors.code?.message}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`input${errors.code ? ' input--error' : ''}`}
              {...register('code')}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={busy}>
              {busy ? 'Verifying…' : 'Enable MFA'}
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-2 text-slate-400">
          <ScanLine size={13} aria-hidden="true" />
          Don&apos;t have an authenticator app? You can still enable MFA using the manual setup key above.
        </div>
      </div>
    </section>
  );
}

function BackupCodes({ codes }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Save your backup codes</h2>
          <p className="panel__desc">These let you sign in if you ever lose access to your authenticator app.</p>
        </div>
        <Badge tone="indigo">Step 2 of 2</Badge>
      </div>
      <div className="panel__body grid gap-5">
        <Alert tone="warning">
          Each code works once. Store them somewhere safe — they are shown only now and will not be displayed again.
        </Alert>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {codes.map((code) => (
            <li
              key={code}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center font-mono text-[13.5px] font-semibold tracking-wider dark:border-slate-700 dark:bg-slate-800"
            >
              {code}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={copyAll}>
            {copied ? (
              <>
                <Check size={15} aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy size={15} aria-hidden="true" /> Copy codes
              </>
            )}
          </Button>
          <Button onClick={() => navigate('/dashboard', { replace: true })}>I&apos;ve saved my codes</Button>
        </div>
      </div>
    </section>
  );
}

function DisableFlow() {
  const navigate = useNavigate();
  const { error, busy, disable } = useMfa();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(mfaDisableSchema) });

  const onSubmit = async (values) => {
    const ok = await disable(values);
    if (ok) navigate('/dashboard', { replace: true });
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Disable two-factor authentication</h2>
          <p className="panel__desc">
            Two-factor is currently <strong>enabled</strong>. Removing it lowers your account&apos;s security.
          </p>
        </div>
      </div>
      <form className="panel__body grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert tone="warning">
          You will need your password and a current 6-digit code to confirm this change.
        </Alert>
        <Alert>{error}</Alert>
        <Field label="Password" required error={errors.password?.message}>
          <input
            type="password"
            className={`input${errors.password ? ' input--error' : ''}`}
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>
        <Field label="Current 6-digit code" required error={errors.code?.message}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`input${errors.code ? ' input--error' : ''}`}
            {...register('code')}
          />
        </Field>
        <div className="flex justify-end">
          <Button variant="danger" type="submit" loading={busy}>
            <ShieldOff size={15} aria-hidden="true" />
            {busy ? 'Disabling…' : 'Disable MFA'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export function MFASetupPage() {
  const { mfaEnabled, qrDataUrl, otpauthUrl, backupCodes, error, busy, startSetup, enable } = useMfa();

  let flow;
  if (backupCodes) {
    flow = <BackupCodes codes={backupCodes} />;
  } else if (mfaEnabled) {
    flow = <DisableFlow />;
  } else if (qrDataUrl) {
    flow = <EnableScan qrDataUrl={qrDataUrl} otpauthUrl={otpauthUrl} error={error} enable={enable} busy={busy} />;
  } else {
    flow = <EnableIntro startSetup={startSetup} busy={busy} />;
  }

  return (
    <>
      <PageHeader
        title="Security"
        subtitle="Manage how you authenticate to your account."
        actions={
          <Badge tone={mfaEnabled ? 'success' : 'warning'} dot>
            {mfaEnabled ? 'Protected' : 'Not protected'}
          </Badge>
        }
      />

      {qrDataUrl || backupCodes ? (
        <div className="mb-4">
          <Steps active={backupCodes ? 'backup' : 'scan'} />
        </div>
      ) : null}

      <div className="grid gap-5">{flow}</div>
    </>
  );
}