import { ChevronLeft } from 'lucide-react';

interface InstructionsPaneProps {
  activePanel: 'brief' | 'functions';
  setActivePanel: (panel: 'brief' | 'functions') => void;
  missionBrief: string;
  availableFunctions: string[];
}

export default function InstructionsPane({ 
  activePanel, 
  setActivePanel, 
  missionBrief, 
  availableFunctions 
}: InstructionsPaneProps) {
  return (
    <div className="w-[40%] flex-shrink-0 flex flex-col border-r-4 border-[#3a2810] relative shadow-2xl bg-[#0c0803]">
      <div className="flex-shrink-0 flex bg-[#1a0e04] border-b border-[#3a2810]">
        <button 
          onClick={() => setActivePanel('brief')} 
          className={`flex-1 py-3 uppercase font-black tracking-[0.2em] text-[10px] ${activePanel === 'brief' ? 'bg-[#f0e0a0]/10 text-[#f0d070] border-b-2 border-[#d4a017]' : 'text-[#a07830]/50'}`}
        >
          The Evidence
        </button>
        <button 
          onClick={() => setActivePanel('functions')} 
          className={`flex-1 py-3 uppercase font-black tracking-[0.2em] text-[10px] ${activePanel === 'functions' ? 'bg-[#f0e0a0]/10 text-[#f0d070] border-b-2 border-[#d4a017]' : 'text-[#a07830]/50'}`}
        >
          Specialized Tools
        </button>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
        {activePanel === 'brief' ? (
          <>
            <h2 className="text-2xl font-black uppercase text-[#f0d070] mb-6 tracking-wider border-b border-[#3a2810] pb-4">
              Mission Directive
            </h2>
            <div className="text-[15px] leading-relaxed text-[#c8a050] font-serif space-y-4 flex-1">
              {missionBrief ? missionBrief.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              )) : <p>Loading directive...</p>}
            </div>
          </>
        ) : (
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase text-[#f0d070] mb-6 tracking-wider border-b border-[#3a2810] pb-4">
              Available Scripts
            </h2>
            <div className="flex gap-2 flex-wrap">
              {availableFunctions.map((fn, i) => (
                <code key={i} className="px-3 py-1.5 bg-[#1a0e04] border border-[#a07830]/30 text-[#f0e0a0] text-[13px] font-mono rounded-sm shadow-sm">{fn}</code>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-[#1a0e04] border-t-2 border-[#3a2810]">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0c0803] border border-[#3a2810] text-[#a07830] text-[10px] uppercase font-black hover:text-[#f0d070] hover:border-[#a07830] transition-colors">
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          <span className="text-[10px] font-black uppercase text-[#a07830] tracking-widest bg-[#f0e0a0]/10 px-2 py-1">Phase 1 of 4</span>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-[#a07830] text-[#140e06] text-[10px] uppercase font-black hover:bg-[#d4a017] transition-colors">
          Next <ChevronLeft className="w-3 h-3 rotate-180" />
        </button>
      </div>
    </div>
  );
}
