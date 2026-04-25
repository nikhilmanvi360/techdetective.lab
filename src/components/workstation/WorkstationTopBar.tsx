import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkstationTopBarProps {
  missionTitle: string;
  navigatePath: string;
}

export default function WorkstationTopBar({ missionTitle, navigatePath }: WorkstationTopBarProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-[#0c0803] border-b-2 border-[#3a2810] shadow-md z-10">
      <div className="flex items-center gap-4 w-1/3">
        <div className="flex items-center gap-2 text-[#a07830]">
          <Compass className="w-5 h-5 text-[#d4a017]" />
          <span className="font-black uppercase tracking-widest text-[14px]">Detective Lab</span>
        </div>
        <span className="text-[#3a2810]">/</span>
        <span className="uppercase text-[#f0e0a0] font-bold text-[13px] tracking-wider truncate">{missionTitle}</span>
      </div>
      
      <div className="flex items-center gap-4 flex-1 justify-center max-w-md mx-4">
        <div className="flex-1 h-2 bg-[#1a0e04] rounded-full overflow-hidden border border-[#3a2810]">
          <div className="h-full bg-gradient-to-r from-[#a07830] to-[#d4a017] w-[40%]" />
        </div>
        <span className="text-[10px] font-mono text-[#a07830] tracking-widest whitespace-nowrap">PHASE 1</span>
      </div>

      <div className="flex items-center gap-4 w-1/3 justify-end">
        <button onClick={() => navigate(navigatePath)} className="px-4 py-1.5 bg-[#1a0e04] border border-[#a07830] text-[#f0d070] text-[11px] uppercase tracking-widest font-black transition-all hover:bg-[#2a1a0a]">
          Return to Board
        </button>
      </div>
    </div>
  );
}
