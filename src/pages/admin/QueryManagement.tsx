import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Clock, MessageSquare, Send, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function QueryManagement() {
  const [queries, setQueries] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = () => {
    fetch('/api/queries')
      .then(res => res.json().catch(() => []))
      .then(data => setQueries(Array.isArray(data) ? data.reverse() : []))
      .catch(err => console.error('Failed to fetch queries:', err));
  };

  const filteredQueries = useMemo(() => {
    return queries.filter(query => {
      const matchesSearch = 
        (query.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (query.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (query.message || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || query.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [queries, searchQuery, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/queries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchQueries();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleReply = async (id: string) => {
    try {
      await fetch(`/api/queries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText, status: 'Resolved' }),
      });
      setReplyingTo(null);
      setReplyText('');
      fetchQueries();
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Query Management</h1>
          <p className="text-slate-400">View and respond to user feedback and questions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search queries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {filteredQueries.map((query: any) => (
          <motion.div
            key={query.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${
              query.status === 'Resolved' 
                ? 'bg-slate-900/50 border-white/5' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-white">{query.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    query.status === 'Resolved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {query.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {query.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{query.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {query.created_at ? format(new Date(query.created_at), 'MMM d, yyyy h:mm a') : 'Unknown time'}
                </p>
              </div>
              
              <div className="flex gap-2">
                {query.status !== 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange(query.id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                {query.status === 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange(query.id, 'Pending')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    Mark Pending
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 mb-4">
              <p className="text-slate-300 whitespace-pre-wrap">{query.message}</p>
            </div>

            {query.reply ? (
              <div className="pl-4 border-l-2 border-indigo-500/50 ml-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-400">Admin Reply</span>
                </div>
                <p className="text-slate-300 text-sm">{query.reply}</p>
              </div>
            ) : (
              <div className="mt-4">
                {replyingTo === query.id ? (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(query.id)}
                        disabled={!replyText.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> Send Reply
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(query.id)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Reply to Query
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
        {filteredQueries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No queries found.
          </div>
        )}
      </div>
    </div>
  );
}
