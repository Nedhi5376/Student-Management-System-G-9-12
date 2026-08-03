import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth.schemas.js';
import { extractErrorMessage, registerRequest } from '../api/auth.api.js';
import { Alert, Field } from '../../../components/ui/Field.jsx';

export function RegisterForm() {
  const [serverError, setServerError] = useState(null);
  const [notice, setNotice] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    setServerError(null);
    setNotice(null);
    try {
      const data = await registerRequest(values);
      setNotice(data.message);
      reset();
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Registration failed'));
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Create your account</h1>
      <Alert>{serverError}</Alert>
      <Alert tone="success">{notice}</Alert>

      <Field label="Name" error={errors.name?.message}>
        <input type="text" autoComplete="name" {...register('name')} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <input type="password" autoComplete="new-password" {...register('confirmPassword')} />
      </Field>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
