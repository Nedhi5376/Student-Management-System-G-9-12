import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    </AuthShell>
  );
}