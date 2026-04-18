import { useState, useEffect } from 'react';
import { User, Trophy, CheckCircle2, History, Clock, ShieldAlert, Award, Activity, Search, TrendingUp, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Team, Puzzle, Submission, ScoreEvent } from '../types';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

export default function Profile() {
  const [data, setData] = useState<{
    team: Team;
    solvedPuzzles: Puzzle[];
    submissions: Submission[];
  } | null>(null);
  const [timeline, setTimeline] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const [profileRes, timelineRes] = await Promise.all([
          fetch('/api/team/profile', { headers }),
          fetch('/api/team/timeline', { headers })
        ]);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.team) setData(profileData);
        }
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          if (Array.isArray(timelineData)) setTimeline(timelineData);
        }
      } catch (err) {
        console.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Activity className="w-12 h-12 text-[#d1b88a] animate-pulse" />
      <div className="typewriter-text text-[#d1b88a] uppercase tracking-widest text-center">
        Retrieving Personnel File...
      </div>
    </div>
  );

  if (!data) return <div className="text-[#8b0000] typewriter-text tracking-widest text-center mt-20 uppercase font-bold text-xl">FILE NOT FOUND in ARCHIVES</div>;

  const { team, solvedPuzzles, submissions } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      
      {/* Top Section - Manila Folder Tabs */}
      <div className="flex gap-2 -mb-8 relative z-10 pl-6">
         <div className="px-6 py-2 bg-[#fdfbf2] border-t-2 border-l-2 border-r-2 border-[rgba(0,0,0,0.1)] rounded-t-md shadow-sm">
            <span className="font-display font-bold text-sm tracking-widest text-black">FILE_ID: {team.id}</span>
         </div>
         <div className="px-6 py-2 bg-[#dfdbcc] border-t border-l border-r border-[rgba(0,0,0,0.1)] rounded-t-md shadow-inner text-gray-500 opacity-60">
            <span className="font-display font-bold text-sm tracking-widest">CLEARANCE</span>
         </div>
      </div>

      {/* Main Personnel Record */}
      <div className="paper-card p-12 relative w-full pt-16 mt-0">
        <div className="absolute top-4 right-6 stamp !rotate-[5deg] !text-black !border-black">CONFIDENTIAL</div>
        
        <div className="flex flex-col md:flex-row items-start gap-12 border-b-2 border-black pb-10">
          {/* Polaroid photo slot */}
          <div className="w-40 h-48 bg-[#fdfaf1] border-8 border-white shadow-md flex flex-col items-center justify-center relative -rotate-3 hover:rotate-0 transition-transform flex-shrink-0">
            <div className="pushpin -top-4 left-1/2 -translate-x-1/2" />
            <User className="w-20 h-20 text-gray-400 opacity-50" />
            <div className="absolute bottom-2 font-display text-[10px] text-gray-500 tracking-widest">SUBJECT_PHOTO</div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="border-b border-dashed border-gray-400 pb-2">
               <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-1">Subject Alias</span>
               <h1 className="text-5xl font-display font-bold text-black uppercase tracking-tighter leading-none">{team.name}</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div>
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-1">Current Classification</span>
                  <div className="font-display font-bold text-xl uppercase tracking-widest text-[#8b0000]">
                    {getRankTitle(team.score)}
                  </div>
               </div>
               <div>
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-1">Date Commissioned</span>
                  <div className="font-mono text-base text-gray-800">
                    {team.created_at ? new Date(team.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                  </div>
               </div>
               <div>
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-1">Operational Role</span>
                  <div className="font-display font-bold text-base uppercase text-gray-800">
                    {team.role === 'analyst' ? 'ANALYST DESK' : 'FIELD INTEL (HACKER)'}
                  </div>
               </div>
               <div>
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-1">Accumulated Evidence Points</span>
                  <div className="font-display font-bold text-2xl text-black flex items-center gap-2">
                    {team.score.toLocaleString()} <span className="text-xs text-gray-500">PTS</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Commendations Section */}
        {team.badges && team.badges.length > 0 && (
          <div className="py-10 border-b-2 border-black">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5 text-gray-600" />
              <h2 className="text-sm font-sans font-bold text-black uppercase tracking-[0.2em]">Official Commendations</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {(team.badges || []).map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-3 border-2 border-gray-300 bg-[#f9f7f1] shadow-sm transform hover:-translate-y-1 transition-transform">
                  <span className="text-xs font-display font-bold text-black uppercase tracking-widest">{badge.badge_name}</span>
                  <span className="text-[9px] font-mono text-gray-500 mt-1">{new Date(badge.earned_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
           {/* Solved Modules List */}
           <div>
              <div className="flex items-center gap-3 mb-6 bg-gray-200 p-2 border border-gray-400">
                <CheckCircle2 className="w-5 h-5 text-gray-700" />
                <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.2em]">Module History</h2>
              </div>
              <table className="w-full text-left font-mono text-sm">
                 <thead>
                    <tr className="border-b-2 border-black">
                       <th className="pb-2 text-xs text-gray-600">ID</th>
                       <th className="pb-2 text-xs text-gray-600 text-right">DATE</th>
                       <th className="pb-2 text-xs text-gray-600 text-right">PAYOUT</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-300">
                    {(solvedPuzzles || []).length > 0 ? (
                      solvedPuzzles.map(p => (
                         <tr key={p.id} className="hover:bg-[rgba(0,0,0,0.02)]">
                            <td className="py-3 font-bold">TASK_0x{p.id}</td>
                            <td className="py-3 text-right text-gray-600">{p.solved_at ? new Date(p.solved_at.replace(' ', 'T') + 'Z').toLocaleDateString() : '-'}</td>
                            <td className="py-3 text-right font-display text-black font-bold">+{p.points}</td>
                         </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="py-4 text-center italic text-gray-500 text-xs">No records found.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>

           {/* Event Timeline */}
           <div>
              <div className="flex items-center gap-3 mb-6 bg-gray-200 p-2 border border-gray-400">
                <History className="w-5 h-5 text-gray-700" />
                <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.2em]">Activity Log</h2>
              </div>
              <div className="relative border-l-2 border-gray-300 ml-3 pl-6 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 {(timeline.slice(0, 15) || []).length > 0 ? (
                   timeline.slice(0,15).map((event, idx) => (
                      <div key={event.id} className="relative">
                         <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-black bg-white" />
                         <div className="text-xs font-display font-bold text-black uppercase tracking-widest">
                            {event.event_type.replace(/_/g, ' ')}
                         </div>
                         <div className="flex justify-between items-end mt-1">
                            <span className="text-[10px] font-mono text-gray-500">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                            <span className={`font-display font-bold ${event.points >= 0 ? 'text-black' : 'text-[#8b0000]'}`}>
                              {event.points >= 0 ? '+' : ''}{event.points} XP
                            </span>
                         </div>
                      </div>
                   ))
                 ) : (
                    <div className="italic text-gray-500 text-xs mt-4">Log is empty.</div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
