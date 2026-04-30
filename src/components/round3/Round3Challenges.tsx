import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Round3Challenges({ timeRemaining = 2700 }: { timeRemaining?: number }) {
  const [activePhase, setActivePhase] = useState<'A' | 'B' | 'C'>('A');
  const [phaseAStatus, setPhaseAStatus] = useState<'pending' | 'solved'>('pending');
  const [phaseBStatus, setPhaseBStatus] = useState<'pending' | 'submitted'>('pending');
  const [phaseCStatus, setPhaseCStatus] = useState<'pending' | 'active' | 'neutralized'>('pending');

  const [evidenceSlots, setEvidenceSlots] = useState<(number | null)[]>([null, null, null, null, null]);
  const availableEvidence = [
    { id: 1, text: "Sehgal granted access to AUDIT simulation environment" },
    { id: 2, text: "Bank authorised a 6-week access window" },
    { id: 3, text: "Report submitted: 12 vulnerabilities, all patched" },
    { id: 4, text: "94% of 4,247 runs target operational patterns — not vulnerabilities" },
    { id: 5, text: "No other consultant has ever triggered AUDIT's discrepancy flag" },
    { id: 6, text: "AUDIT preserved raw logs in a redundant backup Sehgal didn't know existed" },
    { id: 7, text: "LIVE_RUN_PARAMS created at 3:04 AM — six weeks ago" },
    { id: 8, text: "File tag is different from all 4,246 others (TEST_CONFIG vs LIVE_RUN_PARAMS)" },
    { id: 9, text: "File contains real staff names and real cash figures" },
    { id: 10, text: "Execution date: three weeks from tonight" },
    { id: 11, text: "Sehgal is present at this investigation, cooperative" },
    { id: 12, text: "Board signed off on clean report" }
  ];

  const handleSlotClick = (index: number) => {
    if (phaseAStatus === 'solved') return;
    const newSlots = [...evidenceSlots];
    newSlots[index] = null;
    setEvidenceSlots(newSlots);
  };

  const handleEvidenceClick = (id: number) => {
    if (evidenceSlots.includes(id)) return;
    const firstEmpty = evidenceSlots.indexOf(null);
    if (firstEmpty !== -1) {
      const newSlots = [...evidenceSlots];
      newSlots[firstEmpty] = id;
      setEvidenceSlots(newSlots);
    }
  };

  const [mitigationKey, setMitigationKey] = useState('');

  const handleFixSubmit = async () => {
    const res = await fetch('/api/r3/phase-a/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
      body: JSON.stringify({ sequence: evidenceSlots })
    });
    const data = await res.json();
    if (data.success) {
      setPhaseAStatus('solved');
      if (phaseCStatus === 'pending') setPhaseCStatus('active');
    } else {
      alert("INCORRECT CHAIN: Evidence does not support a coherent timeline.");
    }
  };

  const handleDeductionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/r3/phase-b/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
      body: JSON.stringify(body)
    });
    if (res.ok) setPhaseBStatus('submitted');
  };

  const handleMitigation = async () => {
    const res = await fetch('/api/r3/phase-c/mitigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
      body: JSON.stringify({ key: mitigationKey })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setPhaseCStatus('neutralized');
      } else {
        alert("ACCESS DENIED: Invalid Neutralization Key.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
             <div className="text-xl font-mono text-[#f0d070] font-black">{formatTime(timeRemaining)}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-12 overflow-y-auto relative min-h-0">
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
                  <h2 className="text-4xl font-black text-[#f4e6c4] uppercase tracking-tight">Phase A: Evidence <span className="text-[#d4a017]">Timeline</span></h2>
                  <p className="text-[#a07830] font-mono text-sm">CRITICAL: Reconstruct Sehgal's timeline. Select 5 key pieces of evidence in chronological order.</p>
                </div>
                {phaseAStatus === 'solved' && (
                  <div className="flex items-center gap-2 text-green-500 font-black uppercase tracking-widest text-sm animate-pulse">
                    <CheckCircle2 className="w-5 h-5" /> System Stabilized
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-8">
                 <div className="flex justify-between gap-4">
                     {evidenceSlots.map((slot, i) => (
                         <div key={i} onClick={() => slot && handleSlotClick(i)} className={`flex-1 h-32 border-2 ${slot ? 'border-[#d4a017] bg-[#d4a017]/10 cursor-pointer' : 'border-[#3a2810] border-dashed flex items-center justify-center'}`}>
                             {slot ? (
                                 <div className="p-4 text-[11px] text-[#f4e6c4] font-mono leading-tight">
                                     <div className="text-[#d4a017] font-black mb-2 opacity-50">SLOT {i+1}</div>
                                     {availableEvidence.find(e => e.id === slot)?.text}
                                 </div>
                             ) : (
                                 <span className="text-[10px] text-[#a07830] tracking-widest">SLOT {i+1}</span>
                             )}
                         </div>
                     ))}
                 </div>
                 
                 <div className="grid grid-cols-4 gap-4">
                     {availableEvidence.map(ev => (
                         <button key={ev.id} disabled={evidenceSlots.includes(ev.id) || phaseAStatus === 'solved'} onClick={() => handleEvidenceClick(ev.id)} className={`p-4 border text-left font-mono text-xs h-24 transition-all ${evidenceSlots.includes(ev.id) ? 'opacity-20 border-[#3a2810]' : 'border-[#a07830] text-[#f4e6c4] hover:bg-[#a07830]/20 hover:border-[#d4a017]'}`}>
                             <div className="text-[#d4a017] font-black mb-1">EV-{String(ev.id).padStart(2, '0')}</div>
                             {ev.text}
                         </button>
                     ))}
                 </div>

                 {phaseAStatus !== 'solved' && (
                    <button
                      onClick={handleFixSubmit}
                      disabled={evidenceSlots.includes(null)}
                      className="px-12 py-4 bg-[#d4a017] text-black font-black uppercase tracking-[0.3em] text-xs hover:bg-[#f0d070] transition-all disabled:opacity-50 mx-auto"
                    >
                      Verify Timeline
                    </button>
                 )}
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
                    <div className="space-y-2">
                        {['Karan Sehgal', 'The Night Guard', 'Branch Manager', 'IT Tech'].map(opt => (
                            <label key={opt} className="flex items-center gap-3 p-4 border border-[#3a2810] bg-[#0c0803] cursor-pointer hover:border-[#d4a017]">
                                <input type="radio" name="culprit" value={opt} required className="accent-[#d4a017]" />
                                <span className="text-xs uppercase tracking-widest text-[#f4e6c4]">{opt}</span>
                            </label>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em]">Field 2: The Purpose</label>
                    <div className="space-y-2">
                        {['Planning a robbery', 'Covering tracks', 'Fixing a bug', 'Testing the vault'].map(opt => (
                            <label key={opt} className="flex items-center gap-3 p-4 border border-[#3a2810] bg-[#0c0803] cursor-pointer hover:border-[#d4a017]">
                                <input type="radio" name="purpose" value={opt} required className="accent-[#d4a017]" />
                                <span className="text-xs uppercase tracking-widest text-[#f4e6c4]">{opt}</span>
                            </label>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em]">Field 3: Action Required</label>
                  <div className="grid grid-cols-2 gap-4">
                        {['Alert law enforcement', 'Fire him immediately', 'Observe and wait', 'Clean the logs'].map(opt => (
                            <label key={opt} className="flex items-center gap-3 p-4 border border-[#3a2810] bg-[#0c0803] cursor-pointer hover:border-[#d4a017]">
                                <input type="radio" name="action" value={opt} required className="accent-[#d4a017]" />
                                <span className="text-xs uppercase tracking-widest text-[#f4e6c4]">{opt}</span>
                            </label>
                        ))}
                  </div>
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
                        value={mitigationKey}
                        onChange={(e) => setMitigationKey(e.target.value)}
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
