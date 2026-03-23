import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Upload, Search } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ManageMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', role: '', team_id: '', image: '', bio: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMembers();
    fetchTeams();
  }, []);

  const fetchMembers = () => fetch('/api/members?t=' + Date.now()).then(res => res.json()).then(data => setMembers(Array.isArray(data) ? data : []));
  const fetchTeams = () => fetch('/api/teams?t=' + Date.now()).then(res => res.json()).then(data => setTeams(Array.isArray(data) ? data : []));

  const filteredMembers = useMemo(() => {
    return members.filter(member => 
      (member.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await compressImage(file);
      setFormData({ ...formData, image: base64Image });
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/members/${editingId}` : '/api/members';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save member');
      }

      toast.success(`Member ${editingId ? 'updated' : 'created'} successfully!`);
      setFormData({ name: '', role: '', team_id: '', image: '', bio: '' });
      setEditingId(null);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
      console.error('Error saving member:', error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/members/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete member');
        }
        toast.success('Member deleted successfully');
        setDeleteId(null);
        fetchMembers();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error(error.message || 'An error occurred while deleting');
      }
    }
  };

  const handleEdit = (member: any) => {
    setFormData({
      name: member.name || '',
      role: member.role || '',
      team_id: member.team_id || '',
      image: member.image || '',
      bio: member.bio || '',
    });
    setEditingId(member.id);
  };

  const getTeamName = (teamId: string) => {
    const team: any = teams.find((t: any) => t.id === teamId);
    return team ? team.team_name : 'Unknown Team';
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Members</h1>
          <p className="text-slate-400">Add, edit, or remove team members.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">{editingId ? 'Edit Member' : 'Add New Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <input type="text" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Team</label>
                <select required value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none">
                  <option value="">Select a team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.team_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                <textarea required rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image URL or Upload</label>
                <div className="flex gap-2">
                  <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-300"
                    title="Upload Image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  {editingId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', role: '', team_id: '', image: '', bio: '' }); }} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
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
                    <th className="p-4 text-sm font-semibold text-slate-300">Member</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Role</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Team</th>
                    <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member: any) => (
                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                            {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500">?</div>}
                          </div>
                          <div className="font-medium text-white">{member.name}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-300">{member.role}</td>
                      <td className="p-4 text-sm text-slate-300">{getTeamName(member.team_id)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(member)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(member.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">No members found.</td>
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
