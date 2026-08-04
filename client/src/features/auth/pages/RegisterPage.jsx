import { Link } from 'react-router-dom';
import { AuthShell } from '../../../components/layout/AuthShell.jsx';
import { RegisterForm } from '../components/RegisterForm.jsx';

export function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
      <p className="mt-5 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="font-semibold">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}