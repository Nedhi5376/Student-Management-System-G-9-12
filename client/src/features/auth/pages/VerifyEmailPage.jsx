import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/axiosInstance.js';
import { extractErrorMessage } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Field.jsx';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState({ message: 'Verifying your email…', tone: 'success' });

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus({ message: 'Verification token is missing', tone: 'error' });
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then((response) => setStatus({ message: response.data.message, tone: 'success' }))
      .catch((error) => setStatus({ message: extractErrorMessage(error, 'Verification failed'), tone: 'error' }));
  }, [params]);

  return (
    <main className="page">
      <section className="card">
        <h1>Email verification</h1>
        <Alert tone={status.tone}>{status.message}</Alert>
        <Link to="/login">Go to sign in</Link>
      </section>
    </main>
  );
}
