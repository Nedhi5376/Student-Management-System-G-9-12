import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';

/**
 * Client-side gate for UX only — every protected endpoint re-verifies the JWT
 * and role on the server.
 */
// UX-only gate: redirect unauthenticated users to /login and non-admins to the dashboard.
export function ProtectedRoute({ roles }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) return <p className="centered">Checking your session…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
