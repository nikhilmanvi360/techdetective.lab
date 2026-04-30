import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  Shield, Clock, Search, Zap, FileText, Database, 
  Hash, CheckCircle, Lock, AlertTriangle, ChevronRight,
  Activity, Fingerprint, Terminal
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

export default function Round1Page() {
  const [phase, setPhase] = useState('ACTIVE');
  const [monologueData, setMonologueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Evidence Scanner State
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(0);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const socket = io();
    
    fetch('/api/r1/state', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setPhase(data.subPhase || 'ACTIVE');
      setMonologueData(data.monologueData);
      setLoading(false);
    });

    socket.on('r1_phase_update', (data) => setPhase(data.phase));
    socket.on('r1_monologue_update', (data) => setMonologueData(data));

    return () => { socket.disconnect(); };
  }, [token]);

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
    if (!token) return;
    setClaiming(true);
    setResult(null);
    setRevealed(false);

    try {
      const res = await fetch('/api/r1/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        {phase === 'MONOLOGUE' && (
          <motion.div
            key="monologue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-8"
          >
            <div className="glass-panel p-1 border-2 border-[#3a2810] max-w-2xl w-full">
              <div className="bg-[#0c0e0b] p-12 border border-[#d4a017]/20 relative overflow-hidden text-center space-y-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#d4a017]/10 border-2 border-[#d4a017] shadow-[0_0_20px_rgba(212,160,23,0.3)]">
                  <Fingerprint className="w-10 h-10 text-[#d4a017]" />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-glow">Establishing Link</h2>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-[#a07830] uppercase tracking-[0.4em]">Node_Sigma_Active</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-black border border-[#3a2810] relative overflow-hidden">
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3 }}
                      className="h-full bg-[#d4a017] shadow-[0_0_10px_rgba(212,160,23,0.5)]"
                   />
                </div>

                <div className="space-y-3 font-mono text-[10px] text-[#a07830] uppercase tracking-widest leading-relaxed text-left max-w-md mx-auto">
                   <p className="flex gap-4"><span className="text-[#d4a017]/40">[01]</span> LOG_ANALYSIS_PROTOCOL_v4.2</p>
                   <p className="flex gap-4"><span className="text-[#d4a017]/40">[02]</span> CROSS_REFERENCE_PEN_TEST_WITH_LIVE_LOGS</p>
                   <p className="flex gap-4"><span className="text-red-500/40">[03]</span> DISCREPANCIES DETECTED IN NODE_BETA</p>
                </div>

                <button 
                  onClick={() => setPhase('ACTIVE')}
                  className="detective-button w-full"
                >
                  <Zap className="w-4 h-4" /> Initiate Extraction
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
                        <Activity className="w-4 h-4 text-cyber-green animate-pulse" />
                        <span className="text-[9px] font-mono font-black text-cyber-green uppercase tracking-widest">Link_Stable</span>
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
                <div className="w-1/2 border-r border-[#3a2810] flex flex-col bg-black/20">
                    <div className="p-4 border-b border-[#3a2810] flex items-center justify-between bg-black/40 px-8">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#a07830]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a07830]">Doc_ID: Assessment_RPT_26</span>
                        </div>
                        <span className="text-[8px] font-mono text-[#a07830] opacity-40 uppercase">Enc: AES-256</span>
                    </div>
                    
                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
                        <div className="max-w-2xl w-full detective-panel !p-12 relative group hover:border-[#d4a017]/30 transition-all">
                            {/* Document Header */}
                            <div className="text-center border-b border-[#3a2810] pb-8 mb-10">
                                <h2 className="text-2xl font-black text-glow uppercase tracking-tighter mb-2">Penetration Report</h2>
                                <p className="text-[10px] font-mono text-[#a07830] uppercase tracking-[0.5em]">Auth: Karan Sehgal // CCU-X</p>
                            </div>
                            
                            {/* Document Body */}
                            <div className="space-y-8 text-sm text-[#a07830] leading-relaxed font-medium">
                                <p className="pl-4 border-l border-[#d4a017]/20"><strong>EXECUTIVE SUMMARY:</strong> Over the past six weeks, MeridianConsult conducted a comprehensive stress-test of Meridian Bank's physical and digital security perimeters using the proprietary AUDIT simulation environment.</p>
                                <p className="pl-4 border-l border-[#d4a017]/20"><strong>METHODOLOGY:</strong> The assessment utilized 12 distinct attack vectors modeled against current threat intelligence. All vectors were run in the isolated TEST_CONFIG environment.</p>
                                
                                <div className="space-y-4">
                                  <strong className="block text-[#f5e6c8] uppercase tracking-widest text-xs">CRITICAL FINDINGS:</strong>
                                  <div className="grid gap-3">
                                    {['VULN-01: Firewall routing loop in Server Node Beta.', 'VULN-02: Unencrypted traffic on internal HR portal.'].map((v, idx) => (
                                      <div key={idx} className="flex gap-3 items-center p-3 bg-black/40 border border-[#3a2810] rounded text-[11px] font-mono">
                                        <AlertTriangle className="w-3.5 h-3.5 text-[#d4a017]/60" />
                                        {v}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-[10px] uppercase tracking-widest opacity-60 italic">... [Restricted Data Below] ...</p>
                            </div>
                            
                            <div className="absolute top-6 right-6 border-2 border-red-500/20 text-red-500/20 p-3 font-black uppercase tracking-widest text-[10px] transform rotate-12 border-dashed group-hover:opacity-40 transition-opacity">
                                CLASSIFIED_BUREAU_ONLY
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Scanner */}
                <div className="w-1/2 flex flex-col bg-black/40">
                    <div className="p-4 border-b border-[#3a2810] flex items-center gap-2 bg-black/60 px-8">
                        <Terminal className="w-4 h-4 text-[#d4a017]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4a017]">AUDIT Extraction Terminal</span>
                    </div>
                    
                    <div className="p-8 border-b border-[#3a2810] bg-black/20">
                        <form onSubmit={handleManualSubmit} className="max-w-md space-y-4">
                            <label className="block text-[9px] font-mono font-black uppercase tracking-[0.4em] text-[#a07830] ml-1">
                                Extract Fragment via Index Code
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

                    <div className="flex-1 p-10 overflow-y-auto relative custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {claiming && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-6">
                                    <div className="relative">
                                      <div className="w-12 h-12 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
                                      <div className="absolute inset-0 w-12 h-12 border border-[#d4a017]/20 rounded-full" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[#d4a017] animate-pulse">Scanning_Database...</span>
                                      <span className="text-[8px] font-mono text-[#a07830] uppercase tracking-widest">Searching 4,247 index nodes</span>
                                    </div>
                                </motion.div>
                            )}

                            {!claiming && result?.status === 'claimed_by_you' && (
                                <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded">
                                          <CheckCircle className="w-6 h-6 text-cyber-green" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-mono font-black uppercase text-cyber-green tracking-[0.4em]">FRAGMENT_ACQUIRED</div>
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
                                </motion.div>
                            )}

                            {!claiming && result?.status === 'already_taken' && (
                                <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-full">
                                      <Lock className="w-12 h-12 text-red-500 animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-2xl font-black text-[#f5e6c8] uppercase tracking-tighter">Fragment Compromised</div>
                                      <p className="text-[10px] text-[#a07830] uppercase tracking-[0.3em] font-black">Data-lock triggered by {result.claimer || 'another team'}.</p>
                                    </div>
                                </motion.div>
                            )}

                            {!claiming && (result?.status === 'invalid' || result?.status === 'round_over' || result?.status === 'not_started') && (
                                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <AlertTriangle className="w-16 h-16 text-red-500/40" />
                                    <div className="space-y-2">
                                      <div className="text-2xl font-black text-[#f5e6c8] uppercase tracking-tighter">{result.status.replace('_', ' ')}</div>
                                      <p className="text-[10px] text-[#a07830] uppercase tracking-[0.3em] font-black">{result.message || 'Bureau rejection. Verify input.'}</p>
                                    </div>
                                </motion.div>
                            )}
                            
                            {!claiming && !result && (
                                <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-30">
                                    <div className="p-8 border-2 border-[#3a2810] border-dashed rounded-full">
                                      <Search className="w-12 h-12 text-[#a07830]" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.5em] font-black text-[#a07830]">Link Standby // Awaiting Query</span>
                                </div>
                            )}
                        </AnimatePresence>
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

