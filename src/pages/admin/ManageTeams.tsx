import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ManageTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [formData, setFormData] = useState({ team_name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = () => {
    fetch('/api/teams?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTeams(data);
        } else {
          console.error('Failed to fetch teams:', data);
          setTeams([]);
        }
      })
      .catch(err => {
        console.error('Error fetching teams:', err);
        setTeams([]);
      });
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(team => 
      (team.team_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/teams/${editingId}` : '/api/teams';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save team');
      }

      toast.success(`Team ${editingId ? 'updated' : 'created'} successfully!`);
      setFormData({ team_name: '', description: '' });
      setEditingId(null);
      fetchTeams();
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
      console.error('Error saving team:', error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/teams/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete team');
        }
        toast.success('Team deleted successfully');
        setDeleteId(null);
        fetchTeams();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error(error.message || 'An error occurred while deleting');
      }
    }
  };

  const handleEdit = (team: any) => {
    setFormData({
      team_name: team.team_name,
      description: team.description,
    });
    setEditingId(team.id);
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Team"
        message="Are you sure you want to delete this team? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Teams</h1>
          <p className="text-slate-400">Add, edit, or remove society teams.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">{editingId ? 'Edit Team' : 'Add New Team'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                <input type="text" required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  {editingId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ team_name: '', description: '' }); }} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-sm font-semibold text-slate-300">Team Name</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Description</th>
                    <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team: any) => (
                    <tr key={team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white">{team.team_name}</td>
                      <td className="p-4 text-sm text-slate-400 truncate max-w-xs">{team.description}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(team)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(team.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeams.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400">No teams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
