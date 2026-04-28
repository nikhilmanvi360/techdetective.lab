import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, FileText, Zap, Terminal as TerminalIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Round3Challenges() {
  const [activePhase, setActivePhase] = useState<'A' | 'B' | 'C'>('A');
  const [phaseAStatus, setPhaseAStatus] = useState<'pending' | 'solved'>('pending');
  const [phaseBStatus, setPhaseBStatus] = useState<'pending' | 'submitted'>('pending');
  const [phaseCStatus, setPhaseCStatus] = useState<'pending' | 'active' | 'neutralized'>('pending');

  const [fixCode, setFixCode] = useState('{\n  "system": "CORE_NEXUS",\n  "version" 2.4,\n  "authorized_by": "SYS_ADMIN"\n  "extraction_key": "VERDICT_2026"\n  "status": "CORRUPTED"\n}');

  const handleFixSubmit = async () => {
    const res = await fetch('/api/r3/phase-a/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ code: fixCode })
    });
    const data = await res.json();
    if (data.success) {
      setPhaseAStatus('solved');
      if (phaseCStatus === 'pending') setPhaseCStatus('active');
    }
  };

  const handleDeductionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/r3/phase-b/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(body)
    });
    if (res.ok) setPhaseBStatus('submitted');
  };

  const handleMitigation = async () => {
    const res = await fetch('/api/r3/phase-c/mitigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ success: true })
    });
    if (res.ok) setPhaseCStatus('neutralized');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header / Nav */}
      <div className="h-20 border-b-2 border-[#3a2810] bg-[#0c0803] flex items-center px-12 justify-between">
        <div className="flex items-center gap-12">
          <div className="text-xl font-black text-[#d4a017] uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-5 h-5" /> Operation Verdict
          </div>
          <div className="flex gap-4">
            {(['A', 'B', 'C'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePhase(p)}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                  activePhase === p 
                    ? 'bg-[#d4a017] border-[#f0d070] text-black shadow-[0_0_15px_rgba(212,160,23,0.3)]' 
                    : 'bg-black border-[#3a2810] text-[#a07830] hover:border-[#d4a017]/50'
                }`}
              >
                Phase {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
             <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Time Remaining</div>
             <div className="text-xl font-mono text-[#f0d070] font-black">45:00</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-12 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activePhase === 'A' && (
            <motion.div
              key="phaseA"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full flex flex-col gap-8"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-[#f4e6c4] uppercase tracking-tight">Phase A: Technical <span className="text-[#d4a017]">Stabilization</span></h2>
                  <p className="text-[#a07830] font-mono text-sm">CRITICAL: The system core is desynchronized. Fix the syntax errors in the authorization block below.</p>
                </div>
                {phaseAStatus === 'solved' && (
                  <div className="flex items-center gap-2 text-green-500 font-black uppercase tracking-widest text-sm animate-pulse">
                    <CheckCircle2 className="w-5 h-5" /> System Stabilized
                  </div>
                )}
              </div>

              <div className="flex-1 flex gap-8">
                <div className="flex-1 bg-[#0c0803] border-2 border-[#3a2810] p-8 font-mono relative group">
                  <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <TerminalIcon className="w-5 h-5 text-[#d4a017]" />
                  </div>
                  <textarea
                    value={fixCode}
                    onChange={(e) => setFixCode(e.target.value)}
                    disabled={phaseAStatus === 'solved'}
                    className="w-full h-full bg-transparent border-none outline-none text-[#f0d070] resize-none selection:bg-[#d4a017]/30 text-lg leading-relaxed"
                    spellCheck="false"
                  />
                  {phaseAStatus !== 'solved' && (
                    <button
                      onClick={handleFixSubmit}
                      className="absolute bottom-8 right-8 px-12 py-4 bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-500 transition-all shadow-2xl active:scale-95"
                    >
                      Initialize Patch
                    </button>
                  )}
                </div>
                
                <div className="w-80 space-y-6">
                   <div className="bg-[#140e06] border-2 border-[#3a2810] p-6 space-y-4">
                      <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest border-b border-[#3a2810] pb-2">Error Log</div>
                      <div className="space-y-2 text-[10px] font-mono">
                        <div className="text-red-500/80 underline decoration-red-900">Line 3: Unexpected token (Missing colon)</div>
                        <div className="text-red-500/80 underline decoration-red-900">Line 5: Unexpected token (Missing comma)</div>
                      </div>
                   </div>
                   <div className="bg-[#140e06] border-2 border-[#3a2810] p-6 space-y-4">
                      <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest border-b border-[#3a2810] pb-2">Artifact Intel</div>
                      <p className="text-[10px] text-[#a07830]/80 leading-relaxed italic">"The Extraction Key revealed in Phase A is mandatory for the Phase C Counter-Strike."</p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePhase === 'B' && (
            <motion.div
              key="phaseB"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col gap-12 max-w-4xl mx-auto"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-4xl font-black text-[#f4e6c4] uppercase tracking-tight">Phase B: The <span className="text-[#d4a017]">Verdict</span></h2>
                <p className="text-[#a07830] font-mono text-sm">Formalize your investigation. Every field must be cross-referenced with Evidence Codes from Rounds 1 & 2.</p>
              </div>

              <form onSubmit={handleDeductionSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em]">Field 1: The Culprit</label>
                    <input name="culprit" required type="text" placeholder="ENTITY NAME..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs tracking-widest focus:border-[#d4a017] outline-none placeholder:opacity-20" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em]">Field 2: Evidence Chain</label>
                    <input name="evidence" required type="text" placeholder="CODES (E.G. R1-X2, R2-B9)..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs tracking-widest focus:border-[#d4a017] outline-none placeholder:opacity-20" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em]">Field 3: Action / Consequences</label>
                  <textarea name="action" required rows={4} placeholder="SPECIFY THE FINAL COMMAND OR OUTCOME..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-6 text-[#f4e6c4] font-black uppercase text-xs tracking-[0.2em] focus:border-[#d4a017] outline-none placeholder:opacity-20 resize-none" />
                </div>
                
                <button 
                  disabled={phaseBStatus === 'submitted'}
                  className={`w-full py-6 font-black uppercase tracking-[0.5em] text-sm transition-all shadow-2xl ${
                    phaseBStatus === 'submitted' 
                      ? 'bg-green-900/20 text-green-500 border-2 border-green-900 cursor-not-allowed' 
                      : 'bg-[#d4a017] text-black border-2 border-[#f0d070] hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {phaseBStatus === 'submitted' ? 'Dossier Filed // Pending Review' : 'File Final Verdict'}
                </button>
              </form>
            </motion.div>
          )}

          {activePhase === 'C' && (
            <motion.div
              key="phaseC"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full flex flex-col items-center justify-center gap-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-900/20 border border-red-900/40 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active System Threat</span>
                </div>
                <h2 className="text-6xl font-black text-[#f4e6c4] uppercase tracking-tighter">Phase C: The <span className="text-red-500 underline decoration-red-900 underline-offset-8">Counter-Strike</span></h2>
              </div>

              {phaseAStatus !== 'solved' ? (
                <div className="max-w-md text-center space-y-8 bg-[#0c0803] border-2 border-red-900/20 p-12 shadow-2xl">
                   <AlertTriangle className="w-16 h-16 text-red-900 mx-auto" />
                   <div className="space-y-4">
                      <div className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest">Access Denied</div>
                      <p className="text-xs text-[#a07830] font-mono leading-relaxed">System authorization must be stabilized in Phase A before mitigation protocols can be initialized.</p>
                   </div>
                   <button onClick={() => setActivePhase('A')} className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest border-b border-[#d4a017] pb-1 hover:text-[#f0d070] transition-colors">Return to Phase A</button>
                </div>
              ) : phaseCStatus === 'neutralized' ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="text-center space-y-8"
                >
                   <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
                   <div className="space-y-2">
                      <div className="text-4xl font-black text-green-500 uppercase tracking-tighter">Threat Neutralized</div>
                      <div className="text-[10px] font-black text-green-900 uppercase tracking-[0.5em]">System secured // Awaiting final reveal</div>
                   </div>
                </motion.div>
              ) : (
                <div className="w-full max-w-xl space-y-8">
                  <div className="bg-[#0c0803] border-2 border-red-900/40 p-8 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-red-900/10 pointer-events-none transform -rotate-12">
                      <Zap className="w-32 h-32" />
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      <label className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Neutralization Key</label>
                      <input 
                        type="text" 
                        placeholder="ENTER EXTRACTION KEY FROM PHASE A..." 
                        className="w-full bg-black border-2 border-red-900/40 p-5 text-red-500 font-mono text-sm tracking-widest focus:border-red-500 outline-none placeholder:text-red-900/30" 
                      />
                    </div>
                    
                    <button 
                      onClick={handleMitigation}
                      className="w-full py-5 bg-red-900 text-black font-black uppercase tracking-[0.6em] text-xs hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(153,27,27,0.3)]"
                    >
                      Execute Final Strike
                    </button>
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-black text-red-900 uppercase tracking-[0.3em]">
                    <span>Target: 0x9AF2_OVERRIDE</span>
                    <span>Status: MALICIOUS_PROCESS_ACTIVE</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer / Status Bar */}
      <div className="h-10 bg-black border-t-2 border-[#3a2810] flex items-center px-12 justify-between text-[9px] font-black text-[#a07830]/40 uppercase tracking-[0.3em] font-mono">
        <div className="flex gap-8">
          <span>Phase A: {phaseAStatus === 'solved' ? 'STABLE' : 'UNSTABLE'}</span>
          <span>Phase B: {phaseBStatus === 'submitted' ? 'FILED' : 'PENDING'}</span>
          <span>Phase C: {phaseCStatus === 'neutralized' ? 'SECURED' : 'LOCKED'}</span>
        </div>
        <span>CCU_NEXUS_CORE :: TERMINAL_03</span>
      </div>
    </div>
  );
}
