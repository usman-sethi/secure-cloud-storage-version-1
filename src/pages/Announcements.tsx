import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Bell, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJson = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : [];
      } catch (e) {
        console.error(`Failed to parse JSON from ${url}:`, text.substring(0, 100));
        return [];
      }
    };

    fetchJson('/api/announcements')
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch = (announcement.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (announcement.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [announcements, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20">
      <Helmet>
        <title>Announcements | Core Computing Society</title>
        <meta name="description" content="Stay updated with the latest news, updates, and announcements from the Core Computing Society." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-6">
            <Bell className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Announcements</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Stay updated with the latest news, updates, and important notices.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-center bg-white/5 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400">Loading announcements...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {filteredAnnouncements.map((announcement: any, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-semibold text-white">{announcement.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg shrink-0">
                    <Calendar className="w-4 h-4" />
                    {announcement.created_at ? format(new Date(announcement.created_at), 'MMM d, yyyy') : 'Unknown Date'}
                  </div>
                </div>
                {announcement.image && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                    <img 
                      src={announcement.image} 
                      alt={announcement.title} 
                      className="w-full h-auto max-h-96 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="prose prose-invert max-w-none text-slate-300">
                  {announcement.content.split('\n').map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </motion.div>
            ))}
            {filteredAnnouncements.length === 0 && (
              <div className="text-center py-20 text-slate-400 bg-white/5 rounded-2xl border border-white/10">
                <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No announcements found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
