import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Plus, Play, ChevronRight, Search, FileText } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export default function InvestigationLobby() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSound } = useSound();

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000); // Refresh list
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms/active', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error('Failed to fetch investigations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    playSound('click');
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      navigate(`/room/${data.room_code}`);
    } catch (e) {
      alert('Failed to establish new investigation.');
    }
  };

  return (
    <div className="min-h-screen bg-[#140e06] p-4 md:p-8 flex flex-col items-center">
       {/* Corkboard / Desk Background Overlay */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
       
       <div className="max-w-4xl w-full z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-1 h-px bg-[#d4a017]" />
                   <span className="text-[#a07830] font-black tracking-[0.4em] uppercase text-xs">Registry Office</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-[#f0d070] uppercase tracking-tighter">Active Investigations</h1>
             </div>
             
             <button
                onClick={handleCreate}
                className="group relative px-8 py-4 bg-gradient-to-b from-[#a07830] to-[#6a4e1a] border-2 border-[#d4a017] text-[#140e06] font-black uppercase tracking-widest text-sm shadow-2xl transition-all hover:-translate-y-1 hover:brightness-110"
             >
                <div className="absolute -inset-1 border border-[#d4a017]/30 group-hover:-inset-2 transition-all opacity-0 group-hover:opacity-100" />
                <span className="flex items-center gap-3"><Plus className="w-5 h-5" /> Start New Case</span>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
             {/* Left Column: Register & Join */}
             <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#e8d8a0] p-8 border-2 border-[#a07830] shadow-xl relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
                   <h2 className="text-xl font-black text-[#2a1a0a] uppercase tracking-wider mb-6 flex items-center gap-3">
                      <Search className="w-5 h-5 text-[#8B2020]" /> Join Specific Case
                   </h2>
                   
                   <div className="space-y-4 relative z-10">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Archive ID / Code</label>
                         <input 
                           type="text" 
                           maxLength={6}
                           placeholder="EX: XJ3K9P"
                           className="w-full bg-[#140e06]/5 border-2 border-[#a07830]/40 p-4 font-mono text-xl font-black text-[#2a1a0a] uppercase tracking-[0.4em] placeholder-[#2a1a0a]/20 outline-none focus:border-[#d4a017] transition-all"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               const code = (e.currentTarget.value || '').toUpperCase();
                               if (code.length === 6) navigate(`/room/${code}`);
                             }
                           }}
                         />
                      </div>
                      <p className="text-[10px] font-serif italic text-[#a07830]/60">"Enter the 6-digit authorization string provided by your squad lead."</p>
                   </div>
                </div>

                <div className="bg-[#1a0e04] p-8 border-2 border-[#d4a017] shadow-xl text-[#f0d070]">
                   <Users className="w-8 h-8 mb-4 opacity-50" />
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">Field Status</h3>
                   <div className="text-[11px] font-serif italic opacity-60 leading-relaxed mb-6">
                      "Operatives are advised to remain in high-readiness. The syndicate does not sleep, and neither does the bureau."
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#d4a017]">
                      <div className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
                      Dispatch Server Active
                   </div>
                </div>
             </div>

             {/* Right Column: Room List */}
             <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4 px-2">
                   <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.3em]">Operational Archives</div>
                   <button onClick={fetchRooms} className="text-[8px] font-black text-[#d4a017] uppercase tracking-widest hover:underline transition-all">Refresh Registry</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {loading ? (
                      <div className="col-span-full py-20 flex flex-col items-center gap-4 text-[#a07830]">
                         <div className="w-8 h-8 border-2 border-t-transparent border-[#d4a017] rounded-full animate-spin" />
                         <span className="uppercase text-[10px] tracking-[0.3em] font-black">Scanning Frequency...</span>
                      </div>
                   ) : rooms.length === 0 ? (
                      <div className="col-span-full py-24 bg-[#1a0e04]/20 border-4 border-dashed border-[#3a2810] flex flex-col items-center justify-center text-[#a07830]/40">
                         <FileText className="w-12 h-12 mb-4 opacity-10" />
                         <p className="font-serif italic text-sm">"No squads currently in briefing."</p>
                      </div>
                   ) : (
                      rooms.map((room) => (
                         <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group cursor-pointer bg-[#f0e0a0] p-6 border-[8px] border-[#a07830] shadow-xl relative hover:brightness-105 transition-all"
                            onClick={() => { playSound('click'); navigate(`/room/${room.room_code}`); }}
                         >
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
                            
                            <div className="flex justify-between items-start mb-4 border-b border-[#a07830]/30 pb-3">
                               <div>
                                  <div className="text-[9px] font-black text-[#a07830] uppercase mb-1">Squad Lead</div>
                                  <div className="text-lg font-black text-[#2a1a0a] uppercase tracking-tight">{room.host?.name || '---'}</div>
                               </div>
                               <div className="bg-[#2a1a0a] text-[#f0d070] px-3 py-1 font-mono text-xs font-black">
                                  {room.room_code}
                               </div>
                            </div>
 
                            <div className="flex items-center justify-between text-[#a07830]">
                               <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Operatives Active</span>
                               </div>
                               <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                         </motion.div>
                      ))
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* Floating dust particles overlay */}
       <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
    </div>
  );
}
