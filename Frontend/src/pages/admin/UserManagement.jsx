import { useState, useEffect } from 'react';
import { userAPI } from '../../api/api';
import { Users, Trash2, Shield, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(id);
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-purple-500" /> User Management</h1>
        <p className="page-subtitle">View and manage all registered users</p>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input type="text" className="input-field pl-10" placeholder="Search users by name, email or role..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td className="font-mono text-xs">#{u.id}</td>
                <td className="font-medium text-dark-100">
                  <div>{u.name}</div>
                  {u.hospitalName && (
                    <div className="text-xs text-dark-500 font-semibold italic">
                      Associated: {u.hospitalName}
                    </div>
                  )}
                </td>
                <td className="text-dark-400">{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'ADMIN' ? 'badge-primary' :
                    u.role === 'DOCTOR' ? 'badge-info' :
                    u.role === 'CHEMIST' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id || u.role === 'ADMIN'}
                    className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
                    title={u.role === 'ADMIN' ? "Cannot delete admin" : "Delete user"}
                  >
                    {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="text-center py-8 text-dark-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
