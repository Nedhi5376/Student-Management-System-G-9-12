import { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, listUsersRequest, updateUserRoleRequest } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { UserTable } from '../components/UserTable.jsx';

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [busyUserId, setBusyUserId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { data, loading, error, run } = useAsync(() => listUsersRequest({ page, limit }), [page, limit]);

  const users = data?.users;
  const total = data?.total ?? 0;

  const changeLimit = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleRoleChange = async (user, role) => {
    if (user.role === role) return;
    setActionError(null);
    setBusyUserId(user.id);
    try {
      await updateUserRoleRequest(user.id, role);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not update role'));
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading && !data) return <Spinner label="Loading accounts…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load users')} onRetry={run} />;

  return (
    <>
      <PageHeader
        title="User directory"
        subtitle={total > 0 ? `Every registered account — ${total} total.` : 'Every registered account.'}
        actions={
          <Button variant="secondary" onClick={run}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {actionError ? (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <Alert>{extractErrorMessage(error, 'Could not refresh users')}</Alert>
        </div>
      ) : null}

      <section className="panel">
        {users && users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} aria-hidden="true" />}
            title="No accounts yet"
            description="Accounts will appear here as soon as users register."
          />
        ) : users ? (
          <>
            <UserTable users={users} onRoleChange={handleRoleChange} busyUserId={busyUserId} />
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={changeLimit}
            />
          </>
        ) : null}
      </section>
    </>
  );
}