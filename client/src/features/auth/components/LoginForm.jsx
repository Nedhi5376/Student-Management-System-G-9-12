import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage } from '../api/auth.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';

export function LoginForm({ onMfaRequired, onSuccess }) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
      else onSuccess(result.user);
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Sign in failed'));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Welcome To our school </h1>
        <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">Sign in to continue to your account.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert>{serverError}</Alert>

        <Field label="Email or full name" required error={errors.identifier?.message}>
          <input
            type="text"
            className={`input${errors.identifier ? ' input--error' : ''}`}
            autoComplete="username"
            autoFocus
            {...register('identifier')}
          />
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input pr-10${errors.password ? ' input--error' : ''}`}
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute top-1/2 right-1.5 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        </Field>

        <Button type="submit" block loading={isSubmitting} className="mt-1">
          {isSubmitting ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </>
  );
}