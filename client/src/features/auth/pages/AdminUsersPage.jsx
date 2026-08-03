import { useEffect, useState } from 'react';
import { extractErrorMessage, listUsersRequest } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Field.jsx';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listUsersRequest()
      .then((data) => setUsers(data.users))
      .catch((err) => setError(extractErrorMessage(err, 'Could not load users')));
  }, []);

  return (
    <main className="page">
      <section className="card">
        <h1>All users</h1>
        <Alert>{error}</Alert>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>MFA</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.mfaEnabled ? 'on' : 'off'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
