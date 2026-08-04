import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm.jsx';
import { MFAPrompt } from '../components/MFAPrompt.jsx';

// LoginPage: shows the sign-in form, swapping in the MFA code step when the server asks for a second factor.
export function LoginPage() {
  const navigate = useNavigate();
  const [mfaToken, setMfaToken] = useState(null);
  const goToDashboard = () => navigate('/dashboard', { replace: true });

  return (
    <main className="page">
      {mfaToken ? (
        <MFAPrompt mfaToken={mfaToken} onSuccess={goToDashboard} />
      ) : (
        <LoginForm onMfaRequired={setMfaToken} onSuccess={goToDashboard} />
      )}
      <p className="muted">
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
