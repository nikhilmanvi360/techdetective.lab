import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Users, Shield, ArrowRight, FileText, Stamp } from 'lucide-react';

export default function Lobby() {
  const [rooms] = useState([
    { id: '1', code: 'XJ-402', host: 'Detective_Zero', players: 3 },
    { id: '2', code: 'KT-991', host: 'Agent_Smith', players: 1 },
  ]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#140e06] text-[#2a1a0a] p-4 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#d4a017]" />
                <span className="text-[10px] text-[#a07830] font-black uppercase tracking-[0.4em]">Investigation Registry</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#f0e0a0]">Field Operations</h1>
          </div>

          <button 
             onClick={() => navigate('/room/NEW')}
             className="group relative bg-[#8B2020] px-10 py-5 border-4 border-[#3a2810] text-[#f0e0a0] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0"
          >
             <div className="absolute -inset-1 border border-[#f0e0a0]/20 group-hover:-inset-2 transition-all" />
             <span className="flex items-center gap-4"><Plus className="w-5 h-5 shadow-lg" /> Commission New Unit</span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
           {rooms.map((room, i) => (
              <motion.div 
                 key={room.id}
                 initial={{ opacity: 0, rotate: -2 }}
                 animate={{ opacity: 1, rotate: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="bg-[#f0e0a0] p-8 border-t-[20px] border-[#3a2810] shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative group cursor-default"
              >
                 {/* Binding Clip Simulation */}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-8 bg-[#d4a017] border-4 border-[#3a2810] z-20" />
                 
                 <div className="space-y-6 pt-4">
                    <div className="flex justify-between items-start border-b-2 border-dashed border-[#3a2810]/20 pb-4">
                       <div>
                          <span className="text-[10px] text-[#a07830] uppercase font-black tracking-widest mb-1 block leading-none">Case Reference</span>
                          <h3 className="text-3xl font-black text-[#2a1a0a] uppercase font-serif italic tracking-tighter">{room.code}</h3>
                       </div>
                       <div className="bg-[#2a1a0a] text-[#f0e0a0] px-3 py-1 font-mono text-xs font-black">
                          {room.players}/4
                       </div>
                    </div>

                    <div className="space-y-3 font-serif">
                       <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-[#8B2020]" />
                          <span className="text-xs text-[#3a2810]"><span className="opacity-40">Host:</span> {room.host}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <Stamp className="w-4 h-4 text-[#8B2020]" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#a07830]">Status: Waiting for Intel</span>
                       </div>
                    </div>

                    <button 
                       onClick={() => navigate(`/room/${room.code}`)}
                       className="w-full mt-4 py-4 bg-transparent border-2 border-[#3a2810] text-[#3a2810] hover:bg-[#3a2810] hover:text-[#f0e0a0] transition-all text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3"
                    >
                       Assume Command <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>

                 {/* Retro Stamp */}
                 <div className="absolute bottom-4 right-4 w-16 h-16 border-4 border-[#8B2020]/20 rounded-full flex items-center justify-center text-[#8B2020]/20 font-black text-[10px] uppercase -rotate-12 select-none">
                    OPEN
                 </div>
              </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
