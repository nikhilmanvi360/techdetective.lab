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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4 text-[#a07830]">
                   <div className="w-8 h-8 border-2 border-t-transparent border-[#d4a017] rounded-full animate-spin" />
                   <span className="uppercase text-[10px] tracking-[0.3em] font-black">Checking Archives...</span>
                </div>
             ) : rooms.length === 0 ? (
                <div className="col-span-full py-20 bg-[#1a0e04]/50 border-4 border-dashed border-[#3a2810] flex flex-col items-center justify-center text-[#a07830]">
                   <FileText className="w-16 h-16 mb-4 opacity-20" />
                   <p className="font-serif italic text-lg opacity-40">"The station is quiet tonight... no active reports."</p>
                </div>
             ) : (
                rooms.map((room) => (
                   <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group cursor-pointer bg-[#f0e0a0] p-6 border-[8px] border-[#a07830] shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative"
                   >
                      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
                      
                      <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-[#a07830]/30 pb-4">
                         <div>
                            <span className="text-[10px] font-mono text-[#a07830] uppercase">Authorized By</span>
                            <h3 className="text-xl font-black text-[#2a1a0a] uppercase">{room.host?.name}</h3>
                         </div>
                         <div className="bg-[#2a1a0a] px-3 py-1 border border-[#d4a017] text-[#f0d070] font-mono text-sm font-black">
                            {room.room_code}
                         </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[#a07830]">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-black tracking-widest font-mono uppercase">1 Detective Ready</span>
                         </div>
                         
                         <button
                            onClick={() => { playSound('click'); navigate(`/room/${room.room_code}`); }}
                            className="bg-[#2a1a0a] text-[#f0e0a0] p-3 border-2 border-[#a07830] hover:bg-[#3d2610] transition-all"
                         >
                            <ChevronRight className="w-5 h-5" />
                         </button>
                      </div>
                      
                      {/* Stamp Detail */}
                      <div className="absolute -bottom-4 -right-4 w-16 h-16 border-4 border-[#8B2020]/20 rounded-full flex items-center justify-center text-[#8B2020]/20 font-black text-xs uppercase -rotate-12 select-none">
                         OPEN
                      </div>
                   </motion.div>
                ))
             )}
          </div>
       </div>

       {/* Floating dust particles overlay */}
       <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
    </div>
  );
}
