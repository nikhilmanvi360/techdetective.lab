import { ChevronLeft, Info, ScrollText, Zap } from 'lucide-react';

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
    <div className="w-[40%] flex-shrink-0 flex flex-col border-r-2 border-[#3a2810] relative bg-[#0c0e0b]">
      {/* Tab Switcher */}
      <div className="flex-shrink-0 flex bg-[#0c0e0b] border-b border-[#3a2810] p-1 gap-1">
        <button 
          onClick={() => setActivePanel('brief')} 
          className={`flex-1 py-3 flex items-center justify-center gap-2 uppercase font-black tracking-[0.2em] text-[10px] transition-all ${
            activePanel === 'brief' 
              ? 'bg-[#d4a017] text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' 
              : 'text-[#a07830] hover:text-[#f5e6c8] hover:bg-white/5'
          }`}
        >
          <ScrollText className="w-3 h-3" /> Mission_Directive
        </button>
        <button 
          onClick={() => setActivePanel('functions')} 
          className={`flex-1 py-3 flex items-center justify-center gap-2 uppercase font-black tracking-[0.2em] text-[10px] transition-all ${
            activePanel === 'functions' 
              ? 'bg-[#d4a017] text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' 
              : 'text-[#a07830] hover:text-[#f5e6c8] hover:bg-white/5'
          }`}
        >
          <Zap className="w-3 h-3" /> Tech_Specs
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4a017]/5 to-transparent pointer-events-none opacity-20" />
        
        {activePanel === 'brief' ? (
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-[#3a2810] pb-4">
              <div className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
              <h2 className="text-sm font-black uppercase text-[#f5e6c8] tracking-[0.3em]">Operational_Intel</h2>
            </div>
            <div className="text-[14px] leading-relaxed text-[#a07830] font-sans font-medium space-y-6">
              {missionBrief ? missionBrief.split('\n').map((para, idx) => (
                <p key={idx} className="relative pl-4 border-l border-[#3a2810]/50 hover:border-[#d4a017] transition-colors py-1">{para}</p>
              )) : (
                <div className="flex items-center gap-3 animate-pulse">
                  <Info className="w-4 h-4" />
                  <span>Decrypting directive...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-[#3a2810] pb-4">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <h2 className="text-sm font-black uppercase text-[#f5e6c8] tracking-[0.3em]">API_Reference</h2>
            </div>
            <div className="grid gap-4">
              {availableFunctions.map((fn, i) => (
                <div key={i} className="detective-panel !p-4 group hover:border-[#d4a017]/40 transition-all">
                  <code className="text-cyber-green font-mono text-sm group-hover:text-glow-green transition-all">{fn}</code>
                  <div className="mt-2 text-[10px] text-[#a07830] uppercase tracking-widest opacity-60">System_Utility_Function</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 bg-[#0c0e0b] border-t border-[#3a2810]">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[#a07830] hover:text-[#d4a017] transition-colors uppercase text-[9px] font-black tracking-[0.2em]">
            <ChevronLeft className="w-3 h-3" /> Prev
          </button>
          <div className="h-4 w-px bg-[#3a2810]" />
          <span className="text-[9px] font-mono font-black text-[#a07830] uppercase tracking-widest opacity-50">Node_01_v4</span>
        </div>
        <button className="text-[#d4a017] hover:text-[#f5e6c8] transition-colors uppercase text-[9px] font-black tracking-[0.2em] flex items-center gap-2">
          Next <ChevronLeft className="w-3 h-3 rotate-180" />
        </button>
      </div>
    </div>
  );
}

