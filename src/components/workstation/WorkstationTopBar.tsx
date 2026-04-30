import { Compass, Shield, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkstationTopBarProps {
  missionTitle: string;
  navigatePath: string;
}

export default function WorkstationTopBar({ missionTitle, navigatePath }: WorkstationTopBarProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex-shrink-0 h-16 flex items-center justify-between px-8 bg-[#0c0e0b] border-b-2 border-[#3a2810] z-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#d4a017]/5 via-transparent to-transparent opacity-50" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded">
            <Shield className="w-5 h-5 text-[#d4a017]" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-black uppercase tracking-[0.4em] text-[10px] text-[#a07830]">Bureau_Link</span>
            <span className="font-black uppercase tracking-widest text-[12px] text-[#f5e6c8]">Detective Lab</span>
          </div>
        </div>
        <div className="h-8 w-px bg-[#3a2810]" />
        <div className="flex flex-col">
          <span className="font-mono font-black uppercase tracking-[0.4em] text-[9px] text-[#a07830]/60 italic">Active_Case</span>
          <span className="uppercase text-[#d4a017] font-black text-[13px] tracking-widest truncate max-w-[200px]">{missionTitle}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 relative z-10 flex-1 justify-center max-w-xl mx-8">
        <div className="flex items-center gap-3 w-full">
           <Terminal className="w-4 h-4 text-[#a07830]" />
           <div className="flex-1 h-1.5 bg-black border border-[#3a2810] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
             <div className="h-full bg-[#d4a017] w-[65%] shadow-[0_0_10px_rgba(212,160,23,0.3)] transition-all duration-1000" />
           </div>
           <span className="text-[10px] font-mono font-black text-[#d4a017] tracking-[0.3em] whitespace-nowrap">DEPLOYMENT_SYNC</span>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <button 
          onClick={() => navigate(navigatePath)} 
          className="detective-button !px-5 !py-2 !text-[9px]"
        >
          Exit Session
        </button>
      </div>
    </div>
  );
}

