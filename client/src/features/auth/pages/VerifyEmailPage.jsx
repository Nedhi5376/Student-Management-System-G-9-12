import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, TriangleAlert } from 'lucide-react';
import { extractErrorMessage, verifyEmailRequest } from '../api/auth.api.js';
import { AuthShell } from '../../../components/layout/AuthShell.jsx';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';

const REDIRECT_DELAY = 3;

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', message: 'Verifying your email address…' });
  const [seconds, setSeconds] = useState(REDIRECT_DELAY);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: 'This verification link is missing its token and cannot be processed.' });
      return;
    }
    verifyEmailRequest(token)
      .then((data) => setState({ status: 'success', message: data.message }))
      .catch((error) =>
        setState({ status: 'error', message: extractErrorMessage(error, 'Verification failed') }),
      );
  }, [params]);

  useEffect(() => {
    if (state.status !== 'success') return undefined;
    const interval = setInterval(() => setSeconds((value) => value - 1), 1000);
    const timeout = setTimeout(() => navigate('/login', { replace: true }), REDIRECT_DELAY * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [state.status, navigate]);

  const hero =
    state.status === 'success' ? (
      <span className="status-hero status-hero--success h-14 w-14">
        <BadgeCheck size={28} aria-hidden="true" />
      </span>
    ) : state.status === 'error' ? (
      <span className="status-hero status-hero--error h-14 w-14">
        <TriangleAlert size={28} aria-hidden="true" />
      </span>
    ) : (
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600 dark:border-slate-700" aria-hidden="true" />
    );

  return (
    <AuthShell>
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        {hero}
        <h1 className="text-xl font-bold tracking-tight">Email verification</h1>
        <p className="text-[13.5px] text-slate-500 dark:text-slate-400">{state.message}</p>
      </div>

      {state.status === 'success' ? (
        <>
          <Alert tone="success">
            Your account is ready. Redirecting you to sign in in {Math.max(seconds, 0)}s…
          </Alert>
          <Button variant="secondary" block className="mt-4" onClick={() => navigate('/login', { replace: true })}>
            Go to sign in now
          </Button>
        </>
      ) : state.status === 'error' ? (
        <>
          <Alert>{state.message}</Alert>
          <Link to="/login" className="btn btn--secondary btn--block mt-4">
            Back to sign in
          </Link>
        </>
      ) : (
        <Alert tone="info">{state.message}</Alert>
      )}
    </AuthShell>
  );
}