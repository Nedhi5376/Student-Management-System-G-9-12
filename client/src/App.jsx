import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LoginPage } from './features/auth/pages/LoginPage.jsx';
import { RegisterPage } from './features/auth/pages/RegisterPage.jsx';
import { MFASetupPage } from './features/auth/pages/MFASetupPage.jsx';
import { DashboardPage } from './features/auth/pages/DashboardPage.jsx';
import { AdminUsersPage } from './features/auth/pages/AdminUsersPage.jsx';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage.jsx';

// Root component: declare every route, wrapping private pages behind role-based guards.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings/mfa" element={<MFASetupPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
