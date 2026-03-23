import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, ExternalLink, Search, Filter } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import EventRegistrationModal from '../components/EventRegistrationModal';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filter === 'upcoming') {
        return event.date ? isFuture(new Date(event.date)) : true;
      }
      if (filter === 'past') {
        return event.date ? isPast(new Date(event.date)) : false;
      }
      return true;
    });
  }, [events, searchQuery, filter]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20">
      <Helmet>
        <title>Events | Core Computing Society</title>
        <meta name="description" content="Join us for exciting workshops, hackathons, and tech talks organized by the Core Computing Society." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Society Events</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Join us for exciting workshops, hackathons, and tech talks.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400">Loading events...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: any, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-colors flex flex-col group"
              >
                {event.image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-indigo-900/20 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-indigo-500/50" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-sm text-indigo-400 font-medium mb-2">
                    {event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'TBA'}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{event.title}</h3>
                  <p className="text-slate-400 mb-6 flex-1 line-clamp-3">{event.description}</p>
                  
                  {(!event.date || isFuture(new Date(event.date))) && (
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 font-medium hover:bg-indigo-600 hover:text-white transition-colors mt-auto"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                No events found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
