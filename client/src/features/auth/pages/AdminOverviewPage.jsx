import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarClock, Mail, RefreshCw, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { adminStatsRequest, extractErrorMessage, listUsersRequest } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Stat } from '../../../components/ui/Stat.jsx';
import { UserTable } from '../components/UserTable.jsx';

function StatCards({ stats }) {
  const cards = [
    { label: 'Total accounts', value: stats.total, tone: 'slate', icon: Users },
    { label: 'Email verified', value: stats.verified, tone: 'green', icon: BadgeCheck },
    { label: 'Pending verification', value: stats.unverified, tone: 'amber', icon: Mail },
    { label: 'MFA protected', value: stats.mfaEnabled, tone: 'indigo', icon: ShieldCheck },
    { label: 'Administrators', value: stats.admins, tone: 'slate', icon: UserCog },
    { label: 'Signups · last 7 days', value: stats.createdLast7Days, tone: 'green', icon: CalendarClock },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Stat
          key={card.label}
          label={card.label}
          value={card.value}
          tone={card.tone}
          icon={<card.icon size={18} aria-hidden="true" />}
        />
      ))}
    </div>
  );
}

function loadOverview() {
  return Promise.all([adminStatsRequest(), listUsersRequest({ page: 1, limit: 8 })]);
}

export function AdminOverviewPage() {
  const { data, loading, error, run } = useAsync(loadOverview);

  const stats = data?.[0]?.stats;
  const recent = data?.[1]?.users;

  if (loading && !data) return <Spinner label="Loading system overview…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load the system overview')} onRetry={run} />;

  return (
    <>
      <PageHeader
        title="Admin overview"
        subtitle="Real-time summary of every account on the platform."
        actions={
          <Button variant="secondary" onClick={run}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert>{extractErrorMessage(error, 'Could not refresh the system overview')}</Alert>
        </div>
      ) : null}

      {stats ? (
        <div className="mb-4">
          <StatCards stats={stats} />
        </div>
      ) : null}

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Recent signups</h2>
            <p className="panel__desc">The most recently created accounts.</p>
          </div>
          <Link to="/admin/users" className="btn btn--secondary btn--sm">
            View all <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <UserTable users={recent} />
        ) : recent && recent.length === 0 ? (
          <EmptyState
            icon={<Users size={28} aria-hidden="true" />}
            title="No accounts yet"
            description="Accounts will appear here as soon as users register."
          />
        ) : null}
      </section>
    </>
  );
}