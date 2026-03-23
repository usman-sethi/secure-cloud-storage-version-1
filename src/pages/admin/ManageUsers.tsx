import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Shield, User, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const { user: currentUser } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleDeleteClick = (id: string, role: string) => {
    if (role === 'Admin') {
      toast.error('Cannot delete an Admin user.');
      return;
    }
    if (id === currentUser?.id) {
      toast.error('Cannot delete yourself.');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete user');
        }
        toast.success('User deleted successfully!');
        setDeleteId(null);
        fetchUsers();
      } catch (error: any) {
        toast.error(error.message || 'An unexpected error occurred');
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
          <p className="text-slate-400">View all registered users and their roles.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
          />
        </div>
      </motion.div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-slate-300">User</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Email</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Role</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Joined</th>
                <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="font-medium text-white">{user.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{user.email}</td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Admin' 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {user.role === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {user.role}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteClick(user.id, user.role)}
                      disabled={user.role === 'Admin' || user.id === currentUser?.id}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
