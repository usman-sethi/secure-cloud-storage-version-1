import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Upload, Search } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ManageEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', image: '', registration_link: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('/api/events')
      .then(res => res.json().catch(() => []))
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch events:', err));
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

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
    const url = editingId ? `/api/events/${editingId}` : '/api/events';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save event');
      }

      toast.success(editingId ? 'Event updated successfully' : 'Event added successfully');
      setFormData({ title: '', description: '', date: '', image: '', registration_link: '' });
      setEditingId(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'An error occurred while saving');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete event');
        }
        toast.success('Event deleted successfully');
        setDeleteId(null);
        fetchEvents();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error(error.message || 'An error occurred while deleting');
      }
    }
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      image: event.image,
      registration_link: event.registration_link,
    });
    setEditingId(event.id);
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Events</h1>
          <p className="text-slate-400">Add, edit, or remove society events.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">{editingId ? 'Edit Event' : 'Add New Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none resize-none" />
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Registration Link</label>
                <input type="url" value={formData.registration_link} onChange={e => setFormData({...formData, registration_link: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  {editingId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', date: '', image: '', registration_link: '' }); }} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
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
                    <th className="p-4 text-sm font-semibold text-slate-300">Event</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Date</th>
                    <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event: any) => (
                    <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white">{event.title}</div>
                        <div className="text-sm text-slate-400 truncate max-w-xs">{event.description}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-300">{event.date}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(event)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(event.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400">No events found.</td>
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
