import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';

import { Shield, Clock, Search, Zap, FileText, Database, Hash, CheckCircle, Lock, AlertTriangle } from 'lucide-react';

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
    
    // Fetch initial state
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

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Reveal countdown timer
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
    <div className="min-h-screen bg-[#0a0805] text-[#f4e6c4] font-mono">
      <AnimatePresence mode="wait">
        {phase === 'MONOLOGUE' && (
          <motion.div
            key="monologue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-20"
          >
            <div className="max-w-2xl w-full space-y-8 border-2 border-[#d4a017] p-12 bg-[#0c0803] relative overflow-hidden">
               <motion.div 
                 animate={{ y: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                 className="absolute inset-x-0 h-0.5 bg-[#d4a017]/10"
               />
               
               <div className="relative z-10 space-y-6 text-center">
                  <Shield className="w-12 h-12 text-[#d4a017] mx-auto animate-pulse" />
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-[#f4e6c4]">Establishing Link</h2>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3 }}
                        className="h-full bg-[#d4a017]"
                     />
                  </div>
                  <div className="space-y-4 font-mono text-xs text-[#a07830] uppercase tracking-widest leading-relaxed">
                     <p>[SYSTEM]: LOG_ANALYSIS_PROTOCOL_v4.2</p>
                     <p>[DIRECTIVE]: CROSS_REFERENCE_PEN_TEST_WITH_LIVE_LOGS</p>
                     <p>[WARNING]: DISCREPANCIES DETECTED IN NODE_BETA</p>
                  </div>
                  <button 
                    onClick={() => setPhase('ACTIVE')}
                    className="w-full py-4 bg-[#d4a017] text-black font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#f0d070] transition-colors"
                  >
                    Initiate Extraction
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
            className="relative min-h-screen flex flex-col"
          >
            {/* Round 1 HUD */}
            <div className="h-20 border-b-2 border-[#3a2810] bg-[#140e06] flex items-center justify-between px-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#d4a017]" />
                        <div>
                            <h1 className="text-[10px] font-black uppercase tracking-[0.4em]">Meridian Bank Archive</h1>
                            <p className="text-[8px] text-[#a07830] uppercase tracking-widest mt-0.5">Protocol: Log Discrepancy</p>
                        </div>
                    </div>
                    <div className="h-6 w-[2px] bg-[#3a2810]" />
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#d4a017]" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-[#a07830]">Active Link</span>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-[#a07830] uppercase tracking-widest">Network Integrity</span>
                        <div className="w-32 h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-[#d4a017]"
                                animate={{ width: ['90%', '95%', '92%', '98%'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Pane Viewer */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Pane: The Report */}
                <div className="w-1/2 border-r-2 border-[#3a2810] bg-[#0c0803] flex flex-col">
                    <div className="p-4 border-b-2 border-[#3a2810] flex items-center gap-2 bg-[#1a1208]">
                        <FileText className="w-4 h-4 text-[#a07830]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#a07830]">Document Viewer</span>
                    </div>
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="max-w-xl mx-auto bg-[#1a1208] p-12 border border-[#3a2810] shadow-2xl relative">
                            {/* Document Header */}
                            <div className="text-center border-b-2 border-[#3a2810] pb-6 mb-8">
                                <h2 className="text-2xl font-serif text-[#d4a017] mb-2 uppercase tracking-widest">Penetration Assessment Report</h2>
                                <p className="text-xs text-[#a07830] uppercase tracking-widest">Prepared for: Meridian Bank Board of Directors</p>
                                <p className="text-xs text-[#a07830] uppercase tracking-widest mt-1">Consultant: Karan Sehgal</p>
                            </div>
                            
                            {/* Document Body */}
                            <div className="space-y-6 text-sm text-[#f4e6c4]/80 font-serif leading-relaxed">
                                <p><strong>EXECUTIVE SUMMARY:</strong> Over the past six weeks, MeridianConsult conducted a comprehensive stress-test of Meridian Bank's physical and digital security perimeters using the proprietary AUDIT simulation environment.</p>
                                <p><strong>METHODOLOGY:</strong> The assessment utilized 12 distinct attack vectors modeled against current threat intelligence. All vectors were run in the isolated TEST_CONFIG environment.</p>
                                <p><strong>FINDINGS:</strong> We identified 12 critical vulnerabilities within the network topology and physical access protocols. Most notably:</p>
                                <ul className="list-disc pl-6 space-y-2 text-[#a07830]">
                                    <li>VULN-01: Firewall routing loop in Server Node Beta.</li>
                                    <li>VULN-02: Unencrypted traffic on internal HR portal.</li>
                                    <li>... [Pages 3-45 Redacted for Brevity] ...</li>
                                </ul>
                                <p><strong>CONCLUSION:</strong> All 12 identified vulnerabilities have been patched. The system is now certified secure against modeled threats.</p>
                            </div>
                            
                            {/* Stamps */}
                            <div className="absolute top-4 right-4 border-2 border-red-900/50 text-red-900/50 p-2 font-black uppercase tracking-widest text-xs transform rotate-12">
                                BOARD APPROVED
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pane: AUDIT Log */}
                <div className="w-1/2 bg-[#0a0805] flex flex-col">
                    <div className="p-4 border-b-2 border-[#3a2810] flex items-center gap-2 bg-[#1a1208]">
                        <Database className="w-4 h-4 text-[#d4a017]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#d4a017]">AUDIT Simulation Archive</span>
                    </div>
                    
                    <div className="p-8 border-b-2 border-[#3a2810] bg-[#0c0803]">
                        <form onSubmit={handleManualSubmit} className="max-w-md">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#d4a017] mb-2">
                                Query Raw Index
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4a017]" />
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={e => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="EC-XXXX"
                                        className="w-full pl-10 pr-4 py-3 text-sm font-black uppercase tracking-[0.3em] bg-black border-2 border-[#3a2810] text-[#f0d070] outline-none focus:border-[#d4a017] transition-colors"
                                    />
                                </div>
                                <button type="submit" disabled={claiming || !manualCode.trim()} className="px-6 py-3 bg-[#d4a017] text-black text-sm font-black uppercase tracking-widest hover:bg-[#f0d070] transition-colors disabled:opacity-50">
                                    {claiming ? '...' : 'EXTRACT'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto relative">
                        <AnimatePresence mode="wait">
                            {claiming && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full opacity-50">
                                    <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin mb-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#d4a017]">Parsing 4,247 runs...</span>
                                </motion.div>
                            )}

                            {!claiming && result?.status === 'claimed_by_you' && (
                                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6 border-b border-[#3a2810] pb-4">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-green-500 tracking-widest">Match Found</div>
                                            <div className="text-xl font-black text-[#f4e6c4] leading-tight uppercase">{result.evidence?.title}</div>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden border-2 border-[#3a2810] bg-black p-6">
                                        <AnimatePresence>
                                            {!revealed && (
                                                <motion.div className="absolute inset-0 flex items-center justify-center bg-black/95 z-20 backdrop-blur-sm" exit={{ opacity: 0 }}>
                                                    <div className="flex flex-col items-center gap-4">
                                                        <span className="text-4xl font-black text-[#d4a017] animate-pulse">{revealCountdown}</span>
                                                        <span className="text-[10px] text-[#a07830] uppercase tracking-widest font-black">Decrypting Payload</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        
                                        <div className="flex justify-between items-center mb-4 border-b border-[#3a2810] pb-2">
                                            <span className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Index Data</span>
                                            <span className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest">ID: {result.evidence?.code}</span>
                                        </div>
                                        <pre className="text-xs font-mono text-[#f0d070] whitespace-pre-wrap leading-loose">
                                            {result.evidence?.content}
                                        </pre>
                                    </div>
                                    
                                    <div className="text-[10px] font-black uppercase text-[#a07830] tracking-widest mt-4">
                                        +{result.evidence?.points_value} XP EXTRACTED
                                    </div>
                                </motion.div>
                            )}

                            {!claiming && result?.status === 'already_taken' && (
                                <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                                    <Lock className="w-12 h-12 text-red-500 mb-4 opacity-50" />
                                    <div className="text-xl font-black text-[#f4e6c4] uppercase">Fragment Compromised</div>
                                    <p className="text-xs text-[#a07830] mt-2 uppercase tracking-widest">Already extracted by {result.claimer || 'another team'}.</p>
                                </motion.div>
                            )}

                            {!claiming && (result?.status === 'invalid' || result?.status === 'round_over' || result?.status === 'not_started') && (
                                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-50" />
                                    <div className="text-xl font-black text-[#f4e6c4] uppercase">{result.status.replace('_', ' ')}</div>
                                    <p className="text-xs text-[#a07830] mt-2 uppercase tracking-widest">{result.message || 'System rejection. Check input.'}</p>
                                </motion.div>
                            )}
                            
                            {!claiming && !result && (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                    <Search className="w-16 h-16 text-[#a07830] mb-4" />
                                    <span className="text-xs uppercase tracking-widest font-black text-[#a07830]">Awaiting Query</span>
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
            className="flex flex-col items-center justify-center min-h-screen p-10 text-center"
          >
             <Zap className="w-20 h-20 text-[#d4a017] mb-8 animate-pulse" />
             <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Phase Concluded</h1>
             <p className="text-[#a07830] max-w-xl uppercase tracking-widest text-sm leading-relaxed mb-12">
                Log analysis is complete. Proceed to the physical map to retrace the consultant's steps.
             </p>
             <button 
                onClick={() => window.location.href = '/board'}
                className="px-10 py-4 bg-[#d4a017] text-black font-black uppercase tracking-widest hover:bg-[#f0d070] transition-colors"
             >
                Return to Mission Board
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
