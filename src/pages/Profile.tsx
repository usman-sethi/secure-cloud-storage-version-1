import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { UserCircle, Save, Camera, Upload } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profile_pic: user?.profile_pic || '',
    password: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await compressImage(file);
      setFormData({ ...formData, profile_pic: base64Image });
      toast.success('Image compressed and ready to save');
    } catch (error: any) {
      console.error('Error compressing image:', error);
      toast.error(error.message || 'Failed to process image');
      setStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      // Only send password if it was changed
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setStatus('success');
        toast.success('Profile updated successfully!');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update profile');
        setStatus('error');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-slate-400">Manage your account details and preferences.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-indigo-500/50">
                {formData.profile_pic ? (
                  <img src={formData.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-semibold text-white">{user?.name}</h3>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {user?.role}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Profile Picture URL or Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.profile_pic}
                  onChange={(e) => setFormData({ ...formData, profile_pic: e.target.value })}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-300"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="pt-6 border-t border-white/10">
              <h4 className="text-lg font-medium text-white mb-4">Change Password</h4>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6">
            {status === 'success' && <span className="text-emerald-400 text-sm">Profile updated successfully!</span>}
            {status === 'error' && <span className="text-red-400 text-sm">Failed to update profile.</span>}
            {status === 'idle' && <span></span>}
            
            <button
              type="submit"
              disabled={status === 'saving'}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
              <Save className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
