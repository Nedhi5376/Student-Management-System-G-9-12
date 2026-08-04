import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaCodeSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage } from '../api/auth.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Alert, Field } from '../../../components/ui/Field.jsx';

// MFAPrompt: second step of sign-in — submits the one-time code (or backup code) to finish authentication.
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
      await completeMfa({ mfaToken, code });
      onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Verification failed'));
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Two-factor verification</h1>
      <p className="muted">Enter the 6-digit code from your authenticator app, or a backup code.</p>
      <Alert>{serverError}</Alert>

      <Field label="Verification code" error={errors.code?.message}>
        <input type="text" inputMode="text" autoComplete="one-time-code" autoFocus {...register('code')} />
      </Field>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying…' : 'Verify'}
      </button>
    </form>
  );
}
