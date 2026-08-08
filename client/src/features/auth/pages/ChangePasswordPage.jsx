import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { changePasswordSchema } from '../schemas/auth.schemas.js';
import { changePasswordRequest, extractErrorMessage } from '../api/auth.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notice, setNotice] = useState(null);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    setServerError(null);
    setNotice(null);
    let changed = false;
    try {
      const result = await changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setNotice(result.message);
      await logout();
      changed = true;
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Could not change your password'));
    } finally {
      if (changed) navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        title="Change password"
        subtitle="Set a new password for your account. You will need to sign in again after changing it."
      />

      <section className="panel max-w-lg">
        <div className="panel__body">
          {notice ? (
            <div className="mb-4">
              <Alert tone="success">{notice}</Alert>
            </div>
          ) : null}
          {serverError ? (
            <div className="mb-4">
              <Alert>{serverError}</Alert>
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Current password" required error={errors.currentPassword?.message}>
              <input
                type="password"
                className={`input${errors.currentPassword ? ' input--error' : ''}`}
                autoComplete="current-password"
                {...register('currentPassword')}
              />
            </Field>

            <Field
              label="New password"
              required
              hint="At least 12 characters with upper and lower case, a number and a symbol."
              error={errors.newPassword?.message}
            >
              <input
                type="password"
                className={`input${errors.newPassword ? ' input--error' : ''}`}
                autoComplete="new-password"
                {...register('newPassword')}
              />
            </Field>

            <Field label="Confirm new password" required error={errors.confirmPassword?.message}>
              <input
                type="password"
                className={`input${errors.confirmPassword ? ' input--error' : ''}`}
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
            </Field>

            <Button type="submit" loading={isSubmitting} className="mt-1">
              <KeyRound size={15} aria-hidden="true" />
              {isSubmitting ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
