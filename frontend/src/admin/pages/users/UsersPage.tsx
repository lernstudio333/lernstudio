import { useEffect, useState } from 'react';
import { Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../../../lib/supabase';
import type { AdminUser } from '../../types/admin.types';

const ROLE_COLORS: Record<string, string> = {
  admin: 'danger',
  course_editor: 'warning',
  student: 'secondary',
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, first_name, last_name, role, gas_token')
      .order('last_name')
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); }
        else { setUsers((data ?? []) as AdminUser[]); }
        setLoading(false);
      });
  }, []);

  if (loading) return <div><Spinner animation="border" size="sm" /> Loading…</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h5 className="mb-3">Users</h5>
      <Table hover size="sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Token</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{[user.first_name, user.last_name].filter(Boolean).join(' ') || <span className="text-muted">—</span>}</td>
              <td>
                {user.role ? (
                  <Badge bg={ROLE_COLORS[user.role] ?? 'secondary'}>{user.role}</Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <code className="text-muted small">
                  {user.gas_token ? `${user.gas_token.slice(0, 4)}••••` : '—'}
                </code>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={3} className="text-center text-muted">No users</td></tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default UsersPage;
