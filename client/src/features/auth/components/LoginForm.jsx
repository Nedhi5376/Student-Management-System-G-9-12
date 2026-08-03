import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage } from '../api/auth.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Alert, Field } from '../../../components/ui/Field.jsx';

export function LoginForm({ onMfaRequired, onSuccess }) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const result = await login(values);
      if (result.mfaRequired) onMfaRequired(result.mfaToken);
      else onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Sign in failed'));
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Sign in</h1>
      <Alert>{serverError}</Alert>

      <Field label="Email" error={errors.email?.message}>
        <input type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="current-password" {...register('password')} />
      </Field>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
