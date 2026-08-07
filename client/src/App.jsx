import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { useAuth } from './features/auth/hooks/useAuth.js';
import { LoginPage } from './features/auth/pages/LoginPage.jsx';
import { RegisterPage } from './features/auth/pages/RegisterPage.jsx';
import { MFASetupPage } from './features/auth/pages/MFASetupPage.jsx';
import { DashboardPage } from './features/auth/pages/DashboardPage.jsx';
import { AdminOverviewPage } from './features/auth/pages/AdminOverviewPage.jsx';
import { AdminUsersPage } from './features/auth/pages/AdminUsersPage.jsx';
import { AdminClassesPage } from './features/admin/pages/AdminClassesPage.jsx';
import { AdminSubjectsPage } from './features/admin/pages/AdminSubjectsPage.jsx';
import { AdminAssignmentsPage } from './features/admin/pages/AdminAssignmentsPage.jsx';
import { AdminRegisterStudentPage } from './features/admin/pages/AdminRegisterStudentPage.jsx';
import { AdminRegisterTeacherPage } from './features/admin/pages/AdminRegisterTeacherPage.jsx';
import { StudentDashboardPage } from './features/student/pages/StudentDashboardPage.jsx';
import { StudentGradesPage } from './features/student/pages/StudentGradesPage.jsx';
import { StudentAttendancePage } from './features/student/pages/StudentAttendancePage.jsx';
import { TeacherDashboardPage } from './features/teacher/pages/TeacherDashboardPage.jsx';
import { TeacherRosterPage } from './features/teacher/pages/TeacherRosterPage.jsx';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage.jsx';
import { homePathFor } from './features/auth/utils/navigation.js';

function HomeRedirect() {
  const { user, initializing, isAuthenticated } = useAuth();
  if (initializing) return <Spinner label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings/mfa" element={<MFASetupPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<AppShell />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/grades" element={<StudentGradesPage />} />
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route element={<AppShell />}>
          <Route path="/teacher" element={<TeacherDashboardPage />} />
          <Route path="/teacher/assignments/:assignmentId" element={<TeacherRosterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/register" element={<AdminRegisterStudentPage />} />
          <Route path="/admin/register-teacher" element={<AdminRegisterTeacherPage />} />
          <Route path="/admin/classes" element={<AdminClassesPage />} />
          <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
          <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
