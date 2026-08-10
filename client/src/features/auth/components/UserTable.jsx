import { Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../utils/format.js';

export function UserTable({ users, onRoleChange, onEdit, onDelete, busyUserId }) {
  const hasActions = Boolean(onEdit || onDelete);
  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-[13.5px]">
        <thead>
          <tr>
            <th className="th">User</th>
            <th className="th">Role</th>
            <th className="th">National ID</th>
            <th className="th">Email</th>
            <th className="th">Verification</th>
            <th className="th">MFA</th>
            <th className="th">Joined</th>
            {hasActions ? <th className="th">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="td">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.name} size="sm" />
                  <span className="font-semibold">{user.name}</span>
                </div>
              </td>
              <td className="td">
                {onRoleChange ? (
                  <select
                    className="input input--sm w-[110px]"
                    value={user.role}
                    disabled={busyUserId === user.id}
                    onChange={(event) => onRoleChange(user, event.target.value)}
                    aria-label={`Role for ${user.name}`}
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <Badge tone={user.role === 'admin' ? 'indigo' : 'neutral'}>{user.role}</Badge>
                )}
              </td>
              <td className="td text-slate-500 dark:text-slate-400">{user.nationalId ?? '—'}</td>
              <td className="td">
                <div className="max-w-[240px] truncate text-slate-500 dark:text-slate-400">{user.email ?? '—'}</div>
              </td>
              <td className="td">
                <Badge tone={user.emailVerified ? 'success' : 'warning'} dot>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </td>
              <td className="td">
                <Badge tone={user.mfaEnabled ? 'success' : 'neutral'} dot>
                  {user.mfaEnabled ? 'Protected' : 'Off'}
                </Badge>
              </td>
              <td className="td whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(user.createdAt)}</td>
              {hasActions ? (
                <td className="td">
                  {user.role === 'admin' ? (
                    <Badge tone="indigo">Admin</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {onEdit ? (
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => onEdit(user)}
                          disabled={busyUserId === user.id}
                          aria-label={`Edit ${user.name}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => onDelete(user)}
                          disabled={busyUserId === user.id}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
