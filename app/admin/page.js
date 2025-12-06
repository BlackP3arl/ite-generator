'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ITE_VIEWER',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/user/list');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setFormData({ email: '', password: '', name: '', role: 'ITE_VIEWER' });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
      console.error(err);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch('/api/user/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setMessage('Role updated successfully');
        fetchUsers();
      } else {
        setError('Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') {
    return <div style={{ padding: '2rem' }}>Access Denied</div>;
  }

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Calculate role statistics
  const roleStats = {
    total: users.length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    ITE_CREATOR: users.filter(u => u.role === 'ITE_CREATOR').length,
    ITE_REVIEWER: users.filter(u => u.role === 'ITE_REVIEWER').length,
    ITE_APPROVER: users.filter(u => u.role === 'ITE_APPROVER').length,
    ITE_VIEWER: users.filter(u => u.role === 'ITE_VIEWER').length,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>⚙️ User Management & Settings</h1>
          <p style={{ color: '#6c757d', margin: 0 }}>Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="btn btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Role Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{roleStats.total}</div>
          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Total Users</div>
        </div>
        <div style={{ background: '#ffeaa7', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3436' }}>{roleStats.ADMIN}</div>
          <div style={{ fontSize: '0.875rem', color: '#2d3436' }}>Admins</div>
        </div>
        <div style={{ background: '#cfe2ff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#084298' }}>{roleStats.ITE_CREATOR}</div>
          <div style={{ fontSize: '0.875rem', color: '#084298' }}>Creators</div>
        </div>
        <div style={{ background: '#cff4fc', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#055160' }}>{roleStats.ITE_REVIEWER}</div>
          <div style={{ fontSize: '0.875rem', color: '#055160' }}>Reviewers</div>
        </div>
        <div style={{ background: '#d1e7dd', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0a3622' }}>{roleStats.ITE_APPROVER}</div>
          <div style={{ fontSize: '0.875rem', color: '#0a3622' }}>Approvers</div>
        </div>
        <div style={{ background: '#e9ecef', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#495057' }}>{roleStats.ITE_VIEWER}</div>
          <div style={{ fontSize: '0.875rem', color: '#495057' }}>Viewers</div>
        </div>
      </div>

      {message && (
        <div style={{ padding: '1rem', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="ADMIN">Admins ({roleStats.ADMIN})</option>
            <option value="ITE_CREATOR">Creators ({roleStats.ITE_CREATOR})</option>
            <option value="ITE_REVIEWER">Reviewers ({roleStats.ITE_REVIEWER})</option>
            <option value="ITE_APPROVER">Approvers ({roleStats.ITE_APPROVER})</option>
            <option value="ITE_VIEWER">Viewers ({roleStats.ITE_VIEWER})</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {showCreateForm ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {/* Results Count */}
      {(searchTerm || roleFilter !== 'all') && (
        <div style={{ marginBottom: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {showCreateForm && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2>Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Password * (min 8 characters)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="ITE_VIEWER">ITE Viewer (Read-only)</option>
                <option value="ITE_CREATOR">ITE Creator</option>
                <option value="ITE_REVIEWER">ITE Reviewer</option>
                <option value="ITE_APPROVER">ITE Approver</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Auth Method</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                  No users found matching your search criteria
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>{user.name || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  {user.azureId && user.password && 'Both'}
                  {user.azureId && !user.password && 'Azure AD'}
                  {!user.azureId && user.password && 'Email/Password'}
                  {!user.azureId && !user.password && 'None'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      background: user.role === 'ADMIN' ? '#ffeaa7' :
                                 user.role === 'ITE_APPROVER' ? '#d1e7dd' :
                                 user.role === 'ITE_REVIEWER' ? '#cff4fc' :
                                 user.role === 'ITE_CREATOR' ? '#cfe2ff' : 'white',
                    }}
                  >
                    <option value="ITE_VIEWER">ITE Viewer</option>
                    <option value="ITE_CREATOR">ITE Creator</option>
                    <option value="ITE_REVIEWER">ITE Reviewer</option>
                    <option value="ITE_APPROVER">ITE Approver</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => {
                      const password = prompt('Enter new password (min 8 characters):');
                      if (password && password.length >= 8) {
                        fetch('/api/user/password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: user.email, password }),
                        })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.success) {
                              setMessage('Password updated successfully');
                            } else {
                              setError(data.error || 'Failed to update password');
                            }
                          });
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
