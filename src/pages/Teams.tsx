import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/teams?t=' + Date.now()).then((res) => res.json()),
      fetch('/api/members?t=' + Date.now()).then((res) => res.json())
    ])
      .then(([teamsData, membersData]) => {
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setMembers(Array.isArray(membersData) ? membersData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      return (team.team_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
             (team.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [teams, searchQuery]);

  const teamMembers = selectedTeam 
    ? members.filter((m: any) => m.team_id === selectedTeam.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20">
      <Helmet>
        <title>Teams | Core Computing Society</title>
        <meta name="description" content="Discover the specialized teams that power the Core Computing Society." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Teams</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Discover the specialized teams that power the Core Computing Society.
          </p>
        </motion.div>

        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400">Loading teams...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeams.map((team: any, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedTeam(team)}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group flex flex-col h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{team.team_name}</h3>
                <p className="text-slate-400 flex-1">{team.description}</p>
              </motion.div>
            ))}
            {filteredTeams.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                No teams found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Team Members */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900 z-10 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeam.team_name}</h2>
                  <p className="text-slate-400 mt-1">Team Members</p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                  {teamMembers.map((member: any) => (
                    <div key={member.id} className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-indigo-500/30"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border-2 border-indigo-500/30">
                          <Users className="w-10 h-10 text-indigo-400" />
                        </div>
                      )}
                      <h4 className="font-semibold text-lg">{member.name}</h4>
                      <p className="text-indigo-400 text-sm font-medium">{member.role}</p>
                      {member.bio && (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-3">{member.bio}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No members found for this team yet.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
