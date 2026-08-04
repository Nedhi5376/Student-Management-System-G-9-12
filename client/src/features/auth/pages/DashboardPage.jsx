import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// DashboardPage: protected home screen showing the signed-in profile and links to MFA/admin pages.
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="page">
      <section className="card">
        <h1>Welcome, {user.name}</h1>
        <dl className="details">
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Role</dt>
          <dd>{user.role}</dd>
          <dt>Email verified</dt>
          <dd>{user.emailVerified ? 'Yes' : 'No'}</dd>
          <dt>MFA</dt>
          <dd>{user.mfaEnabled ? 'Enabled' : 'Disabled'}</dd>
        </dl>
        <nav className="row">
          <Link to="/settings/mfa">{user.mfaEnabled ? 'Manage MFA' : 'Enable MFA'}</Link>
          {user.role === 'admin' ? <Link to="/admin/users">Admin: users</Link> : null}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
