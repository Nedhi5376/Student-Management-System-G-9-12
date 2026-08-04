import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, MailCheck } from 'lucide-react';
import { registerSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage, registerRequest } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';

export function RegisterForm() {
  const [serverError, setServerError] = useState(null);
  const [notice, setNotice] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    setServerError(null);
    setNotice(null);
    try {
      setNotice(await registerRequest(values));
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Registration failed'));
    }
  };

  if (notice) {
    return (
      <>
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          <span className="status-hero status-hero--success h-14 w-14">
            <MailCheck size={26} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">Check your inbox</h1>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400">{notice.message}</p>
        </div>
        {notice.devVerificationLink ? (
          <div className="alert alert--info">
            <span>
              Development verification link:{' '}
              <a href={notice.devVerificationLink} target="_blank" rel="noreferrer">
                Open verification link <ExternalLink size={12} className="align-middle" />
              </a>
            </span>
          </div>
        ) : null}
        <Link to="/login" className="btn btn--secondary btn--block mt-4">
          Go to sign in <ArrowRight size={15} />
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">Register with a verified email to access your workspace.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert>{serverError}</Alert>

        <Field label="Full name" required error={errors.name?.message}>
          <input
            type="text"
            className={`input${errors.name ? ' input--error' : ''}`}
            autoComplete="name"
            {...register('name')}
          />
        </Field>

        <Field label="Email" required error={errors.email?.message}>
          <input
            type="email"
            className={`input${errors.email ? ' input--error' : ''}`}
            autoComplete="email"
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          required
          hint="At least 12 characters with an uppercase, lowercase, number and symbol."
          error={errors.password?.message}
        >
          <input
            type="password"
            className={`input${errors.password ? ' input--error' : ''}`}
            autoComplete="new-password"
            {...register('password')}
          />
        </Field>

        <Field label="Confirm password" required error={errors.confirmPassword?.message}>
          <input
            type="password"
            className={`input${errors.confirmPassword ? ' input--error' : ''}`}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </Field>

        <Button type="submit" block loading={isSubmitting} className="mt-1">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  );
}