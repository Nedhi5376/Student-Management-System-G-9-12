import { Avatar } from '../../../components/ui/Avatar.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../utils/format.js';

export function UserTable({ users, onRoleChange, busyUserId }) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-[13.5px]">
        <thead>
          <tr>
            <th className="th">User</th>
            <th className="th">Role</th>
            <th className="th">Email</th>
            <th className="th">Verification</th>
            <th className="th">MFA</th>
            <th className="th">Joined</th>
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
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <Badge tone={user.role === 'admin' ? 'indigo' : 'neutral'}>{user.role}</Badge>
                )}
              </td>
              <td className="td">
                <div className="max-w-[240px] truncate text-slate-500 dark:text-slate-400">{user.email}</div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}