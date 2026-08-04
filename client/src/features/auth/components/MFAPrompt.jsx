import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { mfaCodeSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage } from '../api/auth.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';

export function MFAPrompt({ mfaToken, onSuccess }) {
  const { completeMfa } = useAuth();
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(mfaCodeSchema) });

  const onSubmit = async ({ code }) => {
    setServerError(null);
    try {
      const user = await completeMfa({ mfaToken, code });
      onSuccess(user);
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Verification failed'));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Two-factor verification</h1>
        <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">Step 2 of 2 — confirm it&apos;s you with a one-time code.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert>{serverError}</Alert>

        <Field
          label="Verification code"
          required
          hint="Enter the 6-digit code from your authenticator app, or a single-use backup code."
          error={errors.code?.message}
        >
          <input
            type="text"
            inputMode="text"
            className={`input${errors.code ? ' input--error' : ''}`}
            autoComplete="one-time-code"
            autoFocus
            {...register('code')}
          />
        </Field>

        <Button type="submit" block loading={isSubmitting} className="mt-1">
          {isSubmitting ? 'Verifying…' : 'Verify and continue'}
        </Button>

        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Lock size={13} aria-hidden="true" />
          Protected by time-based one-time passcodes
        </div>
      </form>
    </>
  );
}