import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  Shield, Zap, 
  Hash, CheckCircle, Lock, AlertTriangle,
  Activity, Terminal
} from 'lucide-react';

interface ScanResult {
  status: 'claimed_by_you' | 'already_taken' | 'invalid' | 'round_over' | 'not_started';
  evidence?: {
    title: string;
    content: string;
    category: string;
    points_value: number;
    flavor_text: string;
    reveal_delay_seconds: number;
    code?: string;
  };
  claimer?: string;
  message?: string;
}

const REPORT_CATEGORIES = [
  "Network Intrusion (External API)", "Social Engineering Resistance",
  "Physical Access Control", "Staff Authentication Protocols",
  "Firewall Penetration", "Phishing Simulation", "Credential Rotation Audit",
  "Patch Management Review", "Incident Response Drill", "Log Monitoring Check",
  "Endpoint Security Review", "Data Exfiltration Test"
];

export default function Round1Page() {
  const [phase, setPhase] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(0);

  useEffect(() => {
    const socket = io();
    
    fetch('/api/r1/state')
    .then(res => res.json())
    .then(data => {
      setPhase(data.subPhase || 'ACTIVE');
      setLoading(false);
    });

    socket.on('r1_phase_update', (data) => setPhase(data.phase));

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (revealCountdown > 0) {
      const t = setTimeout(() => setRevealCountdown(n => n - 1), 1000);
      return () => clearTimeout(t);
    }
    if (revealCountdown === 0 && result?.status === 'claimed_by_you') {
      setRevealed(true);
    }
  }, [revealCountdown, result]);

  const claimCode = async (code: string) => {
    setClaiming(true);
    setResult(null);
    setRevealed(false);

    try {
      const res = await fetch('/api/r1/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      setResult(data);

      if (data.status === 'claimed_by_you') {
        setRevealCountdown(data.evidence?.reveal_delay_seconds || 3);
      }
    } catch {
      setResult({ status: 'invalid', message: 'Connection to AUDIT servers failed.' });
    } finally {
      setClaiming(false);
    }
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) claimCode(manualCode.trim());
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0c0e0b] text-[#f5e6c8] overflow-hidden flex flex-col">
      <div className="scanline opacity-20" />
      <div className="crt-vignette opacity-50" />
      
      <AnimatePresence mode="wait">
        {phase === 'ACTIVE' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Header HUD */}
            <div className="h-16 border-b-2 border-[#3a2810] bg-[#0c0e0b] flex items-center justify-between px-8 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#d4a017]" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono font-black text-[#a07830] uppercase tracking-[0.4em]">Meridian_Archive</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#f5e6c8]">Log Analysis Phase</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-[#3a2810]" />
                    <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-black text-green-500 uppercase tracking-widest">Link_Stable</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-[#a07830] uppercase tracking-widest">Database_Sync</span>
                        <div className="w-32 h-1 bg-black border border-[#3a2810] mt-1 overflow-hidden relative">
                            <motion.div 
                                className="h-full bg-[#d4a017]"
                                animate={{ width: ['90%', '95%', '92%', '98%'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />
                        </div>
                    </div>
                    <button onClick={() => window.location.href = '/board'} className="detective-button !px-4 !py-1.5 !text-[8px]">
                      Exit_Mission
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
                {/* Left Pane: The Report */}
                <div className="w-1/2 border-r border-[#3a2810] flex flex-col bg-black/20 overflow-y-auto custom-scrollbar p-12">
                    <div className="max-w-2xl w-full mx-auto space-y-10">
                        <div className="text-[10px] text-[#d4a017] uppercase tracking-widest mb-4">
                            submitted_report_v_final.pdf
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-glow uppercase tracking-tighter">Penetration Assessment — Meridian Bank</h2>
                            <p className="text-[#a07830] text-sm font-mono uppercase tracking-widest">Consultant: Karan Sehgal // CCU-X</p>
                            <p className="text-[#a07830] text-sm font-mono uppercase tracking-widest">Tests Conducted: 12</p>
                        </div>
                        
                        {/* Table of 12 report categories */}
                        <div className="detective-panel !p-0 overflow-hidden border-[#d4a017]/20">
                            <table className="w-full text-left font-mono text-[11px]">
                                <thead>
                                    <tr className="bg-black/60 text-[#a07830] border-b border-[#3a2810]">
                                        <th className="p-4 uppercase tracking-widest">Category</th>
                                        <th className="p-4 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#3a2810]">
                                    {REPORT_CATEGORIES.map((cat, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-[#f5e6c8]/80">{cat}</td>
                                            <td className="p-4 text-green-500 font-bold uppercase tracking-widest">PATCHED</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Pane: AUDIT Raw Archive */}
                <div className="w-1/2 flex flex-col bg-[#0c0803] overflow-hidden">
                    <div className="p-4 border-b border-[#3a2810] flex items-center justify-between bg-black/60 px-8">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#d4a017]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4a017]">AUDIT_Simulation_Archive</span>
                        </div>
                        <span className="text-[8px] font-mono text-[#d4a017] animate-pulse">4,247_RUNS_DETECTED</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 relative">
                        {/* Evidence Result Overlay (if any) */}
                        <AnimatePresence mode="wait">
                            {claiming ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#0c0803] flex flex-col items-center justify-center space-y-6">
                                    <div className="w-12 h-12 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[#d4a017] animate-pulse">Scanning_Database...</span>
                                      <span className="text-[8px] font-mono text-[#a07830] uppercase tracking-widest">Searching 4,247 index nodes</span>
                                    </div>
                                </motion.div>
                            ) : result ? (
                                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 z-50 bg-[#0c0803] p-10 overflow-y-auto custom-scrollbar">
                                    <button onClick={() => setResult(null)} className="absolute top-4 right-4 text-[#a07830] hover:text-[#d4a017] uppercase text-[10px] font-black tracking-widest flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Close_Extract
                                    </button>
                                    
                                    {result.status === 'claimed_by_you' ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-mono font-black uppercase text-green-500 tracking-[0.4em]">FRAGMENT_ACQUIRED</div>
                                                    <div className="text-2xl font-black text-[#f5e6c8] leading-tight uppercase tracking-tighter">{result.evidence?.title}</div>
                                                </div>
                                            </div>

                                            <div className="relative detective-panel !p-8 !bg-black overflow-hidden group">
                                                <AnimatePresence>
                                                    {!revealed && (
                                                        <motion.div className="absolute inset-0 flex items-center justify-center bg-black/95 z-20 backdrop-blur-sm border border-[#d4a017]/30" exit={{ opacity: 0 }}>
                                                            <div className="flex flex-col items-center gap-4">
                                                                <span className="text-5xl font-black text-[#d4a017] text-glow animate-pulse font-mono">{revealCountdown}</span>
                                                                <span className="text-[9px] text-[#a07830] uppercase tracking-[0.5em] font-black">Decrypting_Payload</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                
                                                <div className="flex justify-between items-center mb-6 border-b border-[#3a2810] pb-3">
                                                    <span className="text-[9px] font-mono font-black text-[#a07830] uppercase tracking-widest">Metadata_Node</span>
                                                    <span className="text-[9px] font-mono font-black text-[#d4a017] uppercase tracking-widest">UID: {result.evidence?.code}</span>
                                                </div>
                                                <pre className="text-xs font-mono text-glow text-[#d4a017] whitespace-pre-wrap leading-relaxed opacity-90">
                                                    {result.evidence?.content}
                                                </pre>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 bg-[#d4a017]/5 border border-[#d4a017]/20 rounded">
                                              <span className="text-[10px] font-black uppercase text-[#a07830] tracking-widest">Rewards_Disbursed</span>
                                              <span className="text-sm font-black text-[#d4a017] tracking-widest">+{result.evidence?.points_value} XP</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                            <AlertTriangle className="w-16 h-16 text-red-500/40" />
                                            <div className="space-y-2">
                                              <div className="text-2xl font-black text-[#f5e6c8] uppercase tracking-tighter">{result.status.replace('_', ' ')}</div>
                                              <p className="text-[10px] text-[#a07830] uppercase tracking-[0.3em] font-black">{result.message || 'Bureau rejection. Verify input.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* Simulation breakdown table */}
                        <div className="detective-panel !p-0 overflow-hidden">
                          <table className="w-full text-left font-mono text-[10px]">
                            <thead>
                              <tr className="bg-black/60 text-[#a07830] border-b border-[#3a2810]">
                                <th className="p-4 uppercase tracking-widest">Simulation Category</th>
                                <th className="p-4 uppercase tracking-widest">Run Count</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a2810]">
                              {[
                                { cat: "Guard rotation timing — shift gaps", count: 847 },
                                { cat: "Vault access window — minimum staff", count: 1203 },
                                { cat: "Camera coverage — blind spot geometry", count: 634 },
                                { cat: "Cash volume by time of day", count: 412 },
                                { cat: "External exit route — alarm response", count: 891 },
                                { cat: "Other (matches report)", count: 260, highlight: true }
                              ].map((row, idx) => (
                                <tr key={idx} className={row.highlight ? "bg-[#d4a017]/5 text-[#d4a017]" : "text-[#a07830]/80"}>
                                  <td className="p-4 font-bold">{row.cat}</td>
                                  <td className="p-4">{row.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* AUDIT Message */}
                        <div className="border border-[#3a2810] p-8 relative bg-black/40">
                          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4a017]" />
                          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4a017]" />
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4a017]" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4a017]" />
                          
                          <div className="space-y-4 text-xs font-medium leading-relaxed">
                            <p>His report describes 12 tests.</p>
                            <p>The archive contains 4,247 runs.</p>
                            <p>The 12 tests account for 260 runs.</p>
                            <p className="text-[#d4a017] font-black italic">Look at what the other 3,987 were testing.</p>
                            <p className="mt-6 text-[#d4a017] font-black tracking-widest uppercase">— AUDIT</p>
                          </div>
                        </div>

                        {/* Submission bar */}
                        <div className="mt-auto pt-10">
                          <form onSubmit={handleManualSubmit} className="space-y-4">
                            <label className="block text-[9px] font-mono font-black uppercase tracking-[0.4em] text-[#a07830] ml-1">
                              Evidence Code (EV-01) — Identify the anomalous category
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4a017]" />
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={e => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="CODE_XXXX"
                                        className="w-full pl-12 pr-4 py-4 text-xs font-mono font-black uppercase tracking-[0.4em] bg-black/60 border-2 border-[#3a2810] text-[#d4a017] outline-none focus:border-[#d4a017] transition-all"
                                    />
                                </div>
                                <button type="submit" disabled={claiming || !manualCode.trim()} className="detective-button !px-8 disabled:opacity-50">
                                    {claiming ? 'WAIT' : 'EXTRACT'}
                                </button>
                            </div>
                          </form>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {phase === 'SUMMARY' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-8"
          >
             <div className="glass-panel p-1 border-2 border-[#3a2810] max-w-xl w-full text-center">
              <div className="bg-[#0c0e0b] p-12 border border-[#d4a017]/20 relative overflow-hidden space-y-8">
                 <Zap className="w-16 h-16 text-[#d4a017] mx-auto animate-pulse" />
                 <div className="space-y-4">
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-glow">Phase Concluded</h1>
                  <p className="text-[#a07830] uppercase tracking-widest text-[11px] font-black leading-relaxed">
                      Log analysis is complete. Proceed to the physical map to retrace the consultant's steps.
                  </p>
                 </div>
                 <button 
                    onClick={() => window.location.href = '/board'}
                    className="detective-button w-full"
                 >
                    Return to Command Board
                 </button>
              </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
