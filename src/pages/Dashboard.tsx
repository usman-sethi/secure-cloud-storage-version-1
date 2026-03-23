import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { Calendar, Users, Bell, Activity, MessageSquare, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
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

      const [eventsData, teamsData, announcementsData, queriesData] = await Promise.all([
        fetchJson('/api/events'),
        fetchJson('/api/teams'),
        fetchJson('/api/announcements'),
        user?.role === 'Admin' ? fetchJson('/api/queries') : Promise.resolve([])
      ]);
      setEvents(eventsData);
      setTeams(teamsData);
      setAnnouncements(announcementsData);
      setQueries(queriesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const recentActivities = useMemo(() => {
    const activities: any[] = [];
    
    events.forEach(e => {
      activities.push({
        id: `event-${e.id}`,
        type: 'event',
        title: `New Event: ${e.title}`,
        date: e.created_at || new Date(parseInt(e.id)).toISOString(),
        icon: Calendar,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/20'
      });
    });

    announcements.forEach(a => {
      activities.push({
        id: `announcement-${a.id}`,
        type: 'announcement',
        title: `Announcement: ${a.title}`,
        date: a.created_at || new Date(parseInt(a.id)).toISOString(),
        icon: Bell,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20'
      });
    });

    teams.forEach(t => {
      activities.push({
        id: `team-${t.id}`,
        type: 'team',
        title: `New Team Created: ${t.team_name}`,
        date: new Date(parseInt(t.id)).toISOString(),
        icon: Users,
        color: 'text-purple-400',
        bg: 'bg-purple-500/20'
      });
    });

    if (user?.role === 'Admin') {
      queries.forEach(q => {
        activities.push({
          id: `query-${q.id}`,
          type: 'query',
          title: `New Query from ${q.name}`,
          date: q.created_at || new Date(parseInt(q.id)).toISOString(),
          icon: MessageSquare,
          color: 'text-amber-400',
          bg: 'bg-amber-500/20'
        });
      });
    }

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [events, announcements, teams, queries, user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-slate-400">Here's what's happening in the society.</p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Events</p>
              <h3 className="text-2xl font-bold">{events.length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Teams</p>
              <h3 className="text-2xl font-bold">{teams.length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-emerald-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Bell className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Announcements</p>
              <h3 className="text-2xl font-bold">{announcements.length}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Latest Events
          </h2>
          <div className="space-y-4">
            {events.slice(0, 3).map((event: any) => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:bg-slate-900 transition-colors">
                <div className="w-16 h-16 rounded-lg bg-indigo-900/30 flex-shrink-0 overflow-hidden">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-indigo-500/50" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white">{event.title}</h4>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{event.description}</p>
                  <p className="text-xs text-indigo-400 mt-2">
                    {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'TBA'}
                  </p>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-slate-400 text-center py-4">No upcoming events.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity: any) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${activity.bg} shrink-0 mt-1`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.date ? format(new Date(activity.date), 'MMM d, yyyy h:mm a') : 'Unknown time'}
                    </p>
                  </div>
                </div>
              );
            })}
            {recentActivities.length === 0 && (
              <p className="text-slate-400 text-center py-4 text-sm">No recent activity.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
