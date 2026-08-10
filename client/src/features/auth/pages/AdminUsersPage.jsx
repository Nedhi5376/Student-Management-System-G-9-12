import { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import {
  deleteUserRequest,
  extractErrorMessage,
  listUsersRequest,
  updateUserRoleRequest,
} from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EditUserPanel } from '../components/EditUserPanel.jsx';
import { UserTable } from '../components/UserTable.jsx';

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [busyUserId, setBusyUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
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

  const startEdit = (user) => {
    setActionError(null);
    setEditingUser(user);
  };

  const handleSaved = async () => {
    setEditingUser(null);
    await run();
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}? Their marks and attendance will also be removed.`)) return;
    setActionError(null);
    setBusyUserId(user.id);
    try {
      await deleteUserRequest(user.id);
      if (editingUser?.id === user.id) setEditingUser(null);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not delete user'));
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

      {editingUser ? <EditUserPanel user={editingUser} onSaved={handleSaved} onCancel={() => setEditingUser(null)} /> : null}

      <section className="panel">
        {users && users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} aria-hidden="true" />}
            title="No accounts yet"
            description="Accounts will appear here as soon as users register."
          />
        ) : users ? (
          <>
            <UserTable
              users={users}
              onRoleChange={handleRoleChange}
              onEdit={startEdit}
              onDelete={remove}
              busyUserId={busyUserId}
            />
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