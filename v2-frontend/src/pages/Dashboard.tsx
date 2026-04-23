import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, BookOpen, Clock, Map as MapIcon, ArrowUpRight, Compass } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    { title: 'The Registry', desc: 'Active investigation rooms and multi-squad operations.', icon: Compass, path: '/lobby' },
    { title: 'Case Archives', desc: 'Analyze evidence logs and previous case documentation.', icon: FileSearch, path: '/cases' },
    { title: 'Detective Manual', desc: 'Protocol, field guides, and technical laboratory specs.', icon: BookOpen, path: '/manual' },
  ];

  return (
    <div className="min-h-screen bg-[#140e06] text-[#2a1a0a] p-4 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b-4 border-[#3a2810]/20 pb-10">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <div className="w-12 h-0.5 bg-[#8B2020]" />
                <span className="text-[10px] text-[#a07830] font-black uppercase tracking-[0.4em]">Investigation HQ</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#f0e0a0] drop-shadow-lg">Chief Detective_Zero</h1>
          </div>
          
          <div className="flex gap-10">
             <div className="text-right">
                <div className="text-[10px] text-[#a07830] uppercase font-black tracking-widest mb-1">Dossier Status</div>
                <div className="text-xl font-serif italic text-[#f0e0a0]">"Fully Authenticated"</div>
             </div>
             <div className="text-right">
                <div className="text-[10px] text-[#a07830] uppercase font-black tracking-widest mb-1">Service Time</div>
                <div className="text-xl font-mono text-[#d4a017]">08:44:02</div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
           {cards.map((card, i) => (
              <motion.div 
                 key={card.title}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 onClick={() => navigate(card.path)}
                 className="group cursor-pointer bg-[#f0e0a0] border-[8px] border-[#3a2810] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-2 transition-all relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                    <card.icon className="w-20 h-20" />
                 </div>
                 
                 <div className="w-12 h-12 bg-[#3a2810]/5 flex items-center justify-center mb-8 border-2 border-[#3a2810]/10">
                    <card.icon className="w-6 h-6 text-[#8B2020]" />
                 </div>

                 <h3 className="text-2xl font-black uppercase tracking-tight mb-4 font-serif italic border-b-2 border-[#3a2810]/10 pb-2">{card.title}</h3>
                 <p className="text-sm text-[#3a2810]/70 leading-relaxed mb-8 font-serif">{card.desc}</p>
                 
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase text-[#8B2020] group-hover:gap-6 transition-all">
                    Open File <ArrowUpRight className="w-4 h-4" />
                 </div>

                 {/* Corners Decoration */}
                 <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#3a2810]/20" />
                 <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[#3a2810]/20" />
              </motion.div>
           ))}
        </div>

        {/* Global Bulletin Board */}
        <div className="bg-[#e8d5a0] border-[10px] border-[#3a2810] p-10 shadow-2xl relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#8B2020] px-8 py-2 text-[#f0e0a0] text-xs font-black uppercase tracking-[0.4em] shadow-lg">
              Station Bulletin
           </div>
           
           <div className="space-y-6">
              {[
                { time: '12:44:02', msg: 'Detective_Sigma documented new evidence in SUBNET_XJ' },
                { time: '12:42:15', msg: 'Command Center reports minor network interference detected' },
                { time: '12:35:50', msg: 'Unit #402 has completed field training' }
              ].map((log, i) => (
                <div key={i} className="flex gap-6 border-b border-[#3a2810]/10 pb-4 last:border-0 last:pb-0">
                   <span className="font-mono text-[#a07830] text-xs font-black">{log.time}</span>
                   <span className="font-serif italic text-sm text-[#2a1a0a]">{log.msg}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
