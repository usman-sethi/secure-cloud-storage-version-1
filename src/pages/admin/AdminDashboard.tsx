import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, MessageSquare, ShieldAlert, ArrowRight, UserCircle, Database, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ events: 0, teams: 0, members: 0, queries: 0 });
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/events?t=' + Date.now()).then(res => res.json()),
      fetch('/api/teams?t=' + Date.now()).then(res => res.json()),
      fetch('/api/members?t=' + Date.now()).then(res => res.json()),
      fetch('/api/queries?t=' + Date.now()).then(res => res.json())
    ]).then(([events, teams, members, queries]) => {
      setStats({
        events: events.length || 0,
        teams: teams.length || 0,
        members: members.length || 0,
        queries: queries.length || 0
      });
    }).catch(err => console.error('Failed to fetch dashboard stats:', err));
  }, []);

  const handleMigrate = async () => {
    setShowMigrateConfirm(false);
    setIsMigrating(true);
    try {
      const res = await fetch('/api/migrate', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Migration completed successfully!');
        console.log('Migration results:', data.results);
      } else {
        toast.error('Migration failed: ' + data.error);
      }
    } catch (error) {
      toast.error('An error occurred during migration.');
      console.error(error);
    } finally {
      setIsMigrating(false);
    }
  };

  const quickActions = [
    {
      title: 'Manage Events',
      description: 'Add, edit, or remove society events.',
      icon: Calendar,
      path: '/admin/events',
      color: 'indigo'
    },
    {
      title: 'Manage Teams',
      description: 'Create and update specialized teams.',
      icon: Users,
      path: '/admin/teams',
      color: 'purple'
    },
    {
      title: 'Manage Members',
      description: 'Assign users to teams and set roles.',
      icon: UserCircle,
      path: '/admin/members',
      color: 'emerald'
    },
    {
      title: 'Manage Users',
      description: 'View registered users and block/remove them.',
      icon: ShieldAlert,
      path: '/admin/users',
      color: 'rose'
    },
    {
      title: 'Manage Registrations',
      description: 'Review and approve event registrations.',
      icon: ClipboardList,
      path: '/admin/registrations',
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={showMigrateConfirm}
        title="Migrate Data"
        message="Are you sure you want to migrate data from SQLite to Google Sheets? This will only append data to empty sheets."
        onConfirm={handleMigrate}
        onCancel={() => setShowMigrateConfirm(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Overview of society metrics and quick actions.</p>
        </div>
        <button
          onClick={() => setShowMigrateConfirm(true)}
          disabled={isMigrating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Database className="w-4 h-4" />
          {isMigrating ? 'Migrating...' : 'Migrate SQLite to Sheets'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <h3 className="text-2xl font-bold">{stats.events}</h3>
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
              <p className="text-sm text-slate-400 font-medium">Total Teams</p>
              <h3 className="text-2xl font-bold">{stats.teams}</h3>
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
              <UserCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Members</p>
              <h3 className="text-2xl font-bold">{stats.members}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-rose-600/10 border border-rose-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-500/20 rounded-xl">
              <MessageSquare className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Queries</p>
              <h3 className="text-2xl font-bold">{stats.queries}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.title} 
                to={action.path}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${action.color}-500/20 text-${action.color}-400 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                    <p className="text-sm text-slate-400">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
