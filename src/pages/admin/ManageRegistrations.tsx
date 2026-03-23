import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, Search, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regsRes, eventsRes] = await Promise.all([
        fetch('/api/event-registrations'),
        fetch('/api/events')
      ]);
      
      if (!regsRes.ok || !eventsRes.ok) throw new Error('Failed to fetch data');
      
      const regsData = await regsRes.json();
      const eventsData = await eventsRes.json();
      
      setRegistrations(regsData);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/event-registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      setRegistrations(registrations.map(reg => 
        reg.id === id ? { ...reg, status: newStatus } : reg
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  const filteredRegistrations = registrations.filter(reg => 
    (reg.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reg.mobile_number || '').includes(searchQuery) ||
    getEventName(reg.event_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Manage Event Registrations</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, mobile, or event..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
        />
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Event</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Participant</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Details</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Payment Proof</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{getEventName(reg.event_id)}</div>
                    <div className="text-sm text-slate-400">{format(new Date(reg.created_at), 'MMM d, yyyy')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{reg.full_name}</div>
                    <div className="text-sm text-slate-400">{reg.mobile_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-300">Prog: {reg.program}</div>
                    <div className="text-sm text-slate-400">Sec: {reg.section}</div>
                  </td>
                  <td className="px-6 py-4">
                    {reg.payment_proof ? (
                      <button 
                        onClick={() => setSelectedImage(reg.payment_proof)}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        View Proof
                      </button>
                    ) : (
                      <span className="text-slate-500 text-sm">No proof</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={reg.status}
                      onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                      className={`text-sm rounded-lg px-2 py-1 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none ${
                        reg.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        reg.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        reg.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      <option value="registered" className="bg-slate-900 text-slate-300">Registered</option>
                      <option value="pending_approval" className="bg-slate-900 text-yellow-400">Pending</option>
                      <option value="approved" className="bg-slate-900 text-green-400">Approved</option>
                      <option value="rejected" className="bg-slate-900 text-red-400">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Payment Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
