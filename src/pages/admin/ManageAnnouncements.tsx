import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Bell, Search, Filter, Upload } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { compressImage } from '../../lib/imageUtils';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'info', image: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = () => {
    fetch('/api/announcements')
      .then(res => res.json().catch(() => []))
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch announcements:', err));
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
      const matchesSearch = 
        (announcement.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (announcement.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'All' || announcement.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [announcements, searchQuery, typeFilter]);

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
    const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements';

    // Ensure we preserve created_at if editing
    const bodyData = { ...formData };
    if (editingId) {
      const existing = announcements.find((a: any) => a.id === editingId);
      if (existing) {
        (bodyData as any).created_at = (existing as any).created_at;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save announcement');
      }

      toast.success(editingId ? 'Announcement updated successfully' : 'Announcement posted successfully');
      setFormData({ title: '', content: '', type: 'info', image: '' });
      setEditingId(null);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'An error occurred while saving');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/announcements/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete announcement');
        }
        toast.success('Announcement deleted successfully');
        setDeleteId(null);
        fetchAnnouncements();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error(error.message || 'An error occurred while deleting');
      }
    }
  };

  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'info',
      image: announcement.image || '',
    });
    setEditingId(announcement.id);
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Announcements</h1>
          <p className="text-slate-400">Create and manage society announcements.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm appearance-none"
            >
              <option value="All">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Urgent</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none">
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="error">Urgent (Red)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                <textarea required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image (Optional)</label>
                <div className="flex items-center space-x-4">
                  {formData.image && (
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded-lg border border-white/10"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  {editingId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Post</>}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', content: '', type: 'info', image: '' }); }} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
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
                    <th className="p-4 text-sm font-semibold text-slate-300">Announcement</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Date Posted</th>
                    <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((announcement: any) => {
                    let typeColor = 'border-l-indigo-500';
                    if (announcement.type === 'success') typeColor = 'border-l-emerald-500';
                    if (announcement.type === 'warning') typeColor = 'border-l-amber-500';
                    if (announcement.type === 'error') typeColor = 'border-l-red-500';

                    return (
                      <tr key={announcement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className={`pl-3 border-l-4 ${typeColor} flex items-start gap-4`}>
                            {announcement.image && (
                              <img 
                                src={announcement.image} 
                                alt={announcement.title}
                                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div>
                              <div className="font-medium text-white">{announcement.title}</div>
                              <div className="text-sm text-slate-400 mt-1 line-clamp-2">{announcement.content}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-300">
                          {announcement.created_at ? format(new Date(announcement.created_at), 'MMM d, yyyy') : 'Unknown'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(announcement)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteId(announcement.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAnnouncements.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400">No announcements found.</td>
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
