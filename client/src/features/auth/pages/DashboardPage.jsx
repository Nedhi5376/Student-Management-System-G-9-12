import { Link } from 'react-router-dom';
import { CircleAlert, MailCheck, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { formatDate } from '../utils/format.js';
import { Avatar } from '../../../components/ui/Avatar.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Alert } from '../../../components/ui/Alert.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';

function DetailRow({ icon, label, value, action }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">{value}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <>
      <PageHeader title={`Good to see you, ${firstName}`} subtitle="Here's the current state of your account." />

      {!user.emailVerified ? (
        <div className="mb-4">
          <Alert tone="warning">
            Your email address hasn&apos;t been verified yet. Use the link sent to {user.email} to verify it.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Profile</h2>
              <p className="panel__desc">Your identity on the platform.</p>
            </div>
          </div>
          <div className="panel__body">
            <div className="flex items-center gap-3.5">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0">
                <div className="text-base font-bold">{user.name}</div>
                <div className="truncate text-slate-500 dark:text-slate-400">{user.email ?? '—'}</div>
              </div>
            </div>
            <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
              <DetailRow
                icon={<UserRound size={16} aria-hidden="true" />}
                label="Role"
                value={
                  user.role === 'admin'
                    ? 'Administrator'
                    : user.role === 'teacher'
                      ? 'Teacher'
                      : 'Student'
                }
                action={<Badge tone={user.role === 'admin' ? 'primary' : 'neutral'}>{user.role}</Badge>}
              />
              <DetailRow
                icon={<ShieldCheck size={16} aria-hidden="true" />}
                label="Member since"
                value={formatDate(user.createdAt)}
                action={<Badge tone="neutral">Active</Badge>}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Account security</h2>
              <p className="panel__desc">Verification and multi-factor status.</p>
            </div>
          </div>
          <div className="panel__body divide-y divide-slate-200 dark:divide-slate-800">
            <DetailRow
              icon={<MailCheck size={16} aria-hidden="true" />}
              label="Email address"
              value={user.email}
              action={
                <Badge tone={user.emailVerified ? 'success' : 'warning'} dot>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              }
            />
            <DetailRow
              icon={user.mfaEnabled ? <ShieldCheck size={16} aria-hidden="true" /> : <ShieldAlert size={16} aria-hidden="true" />}
              label="Two-factor authentication"
              value="Time-based one-time passcodes"
              action={
                user.mfaEnabled ? (
                  <Badge tone="success" dot>
                    Protected
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    Not enabled
                  </Badge>
                )
              }
            />
          </div>
          <div className="panel__footer flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              {!user.mfaEnabled ? <CircleAlert size={14} aria-hidden="true" /> : null}
              {user.mfaEnabled ? 'Recovery options are configured.' : 'Set up MFA to protect your account.'}
            </span>
            <Link to="/settings/mfa" className="btn btn--secondary btn--sm">
              {user.mfaEnabled ? 'Manage' : 'Set up'}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}