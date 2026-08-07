import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { homePathFor } from '../features/auth/utils/navigation.js';
import { Spinner } from './ui/Spinner.jsx';

export function ProtectedRoute({ roles }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;

  return <Outlet />;
}
