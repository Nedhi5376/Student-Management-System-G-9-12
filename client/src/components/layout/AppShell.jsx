import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  BookUser,
  Building2,
  CalendarCheck,
  ClipboardList,
  Download,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Shield,
  UserPlus,
  UserRound,
  Users,
  X,
  KeyRound,
  FileText,
  History,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth.js';
import { Avatar } from '../ui/Avatar.jsx';
import { BrandMark } from './BrandMark.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

function buildNav(user) {
  const role = user?.role;
  const items = [
    { kind: 'link', to: '/dashboard', label: 'My account', icon: UserRound, end: true },
    { kind: 'link', to: '/settings/mfa', label: 'Security', icon: Shield, end: true },
    { kind: 'link', to: '/settings/password', label: 'Change password', icon: KeyRound, end: true },
  ];

  if (role === 'student') {
    items.push(
      { kind: 'section', key: 'student', label: 'Student' },
      { kind: 'link', to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
      { kind: 'link', to: '/student/grades', label: 'Academic History', icon: History, end: true },
      { kind: 'link', to: '/student/attendance', label: 'Attendance', icon: CalendarCheck, end: true },
      { kind: 'link', to: '/student/transcript', label: 'Transcript', icon: FileText, end: true },
    );
  }

  if (role === 'teacher') {
    items.push(
      { kind: 'section', key: 'teaching', label: 'Teaching' },
      { kind: 'link', to: '/teacher', label: 'My classes', icon: BookOpen, end: true },
    );
  }

  if (role === 'admin') {
    items.push(
      { kind: 'section', key: 'admin', label: 'Administration' },
      { kind: 'link', to: '/admin', label: 'Overview', icon: Server, end: true },
      { kind: 'section', key: 'student-mgmt', label: 'Student Management' },
      { kind: 'link', to: '/admin/register', label: 'Register student', icon: UserPlus, end: true },
      { kind: 'link', to: '/admin/register-teacher', label: 'Register teacher', icon: BookUser, end: true },
      { kind: 'link', to: '/admin/users', label: 'User directory', icon: Users, end: true },
      { kind: 'link', to: '/admin/classes', label: 'Classes', icon: Building2, end: true },
      { kind: 'section', key: 'academic-history', label: 'Academic History' },
      { kind: 'link', to: '/admin/academic-history', label: 'Historical Records', icon: History, end: true },
      { kind: 'section', key: 'curriculum', label: 'Curriculum' },
      { kind: 'link', to: '/admin/subjects', label: 'Subjects', icon: BookMarked, end: true },
      { kind: 'link', to: '/admin/assignments', label: 'Assignments', icon: ClipboardList, end: true },
    );
  }

  return items;
}

const TITLES = {
  '/dashboard': 'My account',
  '/settings/mfa': 'Security',
  '/settings/password': 'Change password',
  '/student': 'Student overview',
  '/student/grades': 'Academic History',
  '/student/attendance': 'My attendance',
  '/student/transcript': 'Transcript',
  '/teacher': 'My classes',
  '/admin': 'Admin overview',
  '/admin/register': 'Register student',
  '/admin/register-teacher': 'Register teacher',
  '/admin/users': 'User directory',
  '/admin/classes': 'Classes',
  '/admin/subjects': 'Subjects',
  '/admin/assignments': 'Assignments',
  '/admin/academic-history': 'Historical Records',
};

function NavItems({ nav, onNavigate }) {
  return (
    <>
      {nav.map((item) =>
        item.kind === 'section' ? (
          <div key={item.key} className="px-3 pt-5 pb-2 text-[10.5px] font-bold tracking-widest text-sidebar-text uppercase">
            {item.label}
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            onClick={onNavigate}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </NavLink>
        ),
      )}
    </>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = buildNav(user);
  const title =
    TITLES[location.pathname] ?? (location.pathname.startsWith('/teacher/assignments/') ? 'Class roster' : 'Account');
  const closeDrawer = () => setDrawerOpen(false);

  const signOut = async () => {
    closeDrawer();
    await logout();
    navigate('/login', { replace: true });
  };

  const userCard = (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={user?.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-white">{user?.name}</div>
        <div className="truncate text-[11.5px] text-slate-400">
          {user?.role === 'admin' ? 'Administrator' : user?.role === 'teacher' ? 'Teacher' : 'Student'}
        </div>
      </div>
      <button
        type="button"
        className="btn btn--ghost btn--sm btn--icon text-slate-300 hover:bg-white/10 hover:text-white"
        onClick={signOut}
        aria-label="Sign out"
      >
        <LogOut size={16} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden h-screen flex-col bg-sidebar px-3.5 py-4 text-sidebar-text lg:sticky lg:top-0 lg:flex lg:w-60 lg:shrink-0">
        <div className="px-2 pb-6">
          <BrandMark onDark />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Primary">
          <NavItems nav={nav} />
        </nav>
        <div className="mt-4 border-t border-white/10 px-2 pt-4">{userCard}</div>
      </aside>

      {drawerOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/60" onClick={closeDrawer} aria-hidden="true" />
          <div
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar px-3.5 py-4 text-sidebar-text shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex items-center justify-between px-2 pb-6">
              <BrandMark onDark />
              <button
                type="button"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sidebar-text transition-colors hover:bg-white/10 hover:text-white"
                onClick={closeDrawer}
                aria-label="Close menu"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5" aria-label="Primary">
              <NavItems nav={nav} onNavigate={closeDrawer} />
            </nav>
            <div className="mt-4 border-t border-white/10 px-2 pt-4">{userCard}</div>
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <span className="lg:hidden">
              <BrandMark />
            </span>
            <span className="hidden text-[15px] font-semibold tracking-tight lg:block">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {import.meta.env.DEV ? (
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-primary-700 uppercase dark:bg-primary-500/15 dark:text-primary-300">
                Development
              </span>
            ) : null}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}