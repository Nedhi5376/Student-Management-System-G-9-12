import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../../components/layout/AuthShell.jsx';
import { LoginForm } from '../components/LoginForm.jsx';
import { MFAPrompt } from '../components/MFAPrompt.jsx';
import { homePathFor } from '../utils/navigation.js';

export function LoginPage() {
  const navigate = useNavigate();
  const [mfaToken, setMfaToken] = useState(null);
  const goHome = (user) => navigate(homePathFor(user), { replace: true });

  return (
    <AuthShell>
      {mfaToken ? (
        <MFAPrompt mfaToken={mfaToken} onSuccess={goHome} />
      ) : (
        <LoginForm onMfaRequired={setMfaToken} onSuccess={goHome} />
      )}
      <p className="mt-5 text-center text-[13px] text-slate-500 dark:text-slate-400">
        No account?{' '}
        <Link to="/register" className="font-semibold">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}