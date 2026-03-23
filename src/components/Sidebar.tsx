import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  Settings,
  LogOut,
  ShieldAlert,
  MessageSquare,
  Terminal,
  Bell,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Announcements', path: '/announcements', icon: Bell },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert },
    { name: 'Manage Events', path: '/admin/events', icon: Calendar },
    { name: 'Manage Teams', path: '/admin/teams', icon: Users },
    { name: 'Manage Members', path: '/admin/members', icon: UserCircle },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Registration Requests', path: '/admin/registrations', icon: ClipboardList },
    { name: 'Manage Announcements', path: '/admin/announcements', icon: Bell },
    { name: 'Queries', path: '/admin/queries', icon: MessageSquare },
  ];

  const links = user?.role === 'Admin' ? [...userLinks, ...adminLinks] : userLinks;

  return (
    <div className={`w-64 bg-slate-900 border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-white/10 h-16 md:h-auto">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-200 hidden md:flex">
          <img src="/logo.png" alt="CCS Logo" className="w-full h-full object-contain" onError={(e) => {
            // Fallback if logo.png is not found
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }} />
          <Terminal className="w-6 h-6 text-indigo-600 hidden" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 hidden md:block">
          CCS Portal
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 pb-24 md:pb-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
