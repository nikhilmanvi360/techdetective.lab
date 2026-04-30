import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CheckCircle, AlertTriangle, QrCode, Hash, ArrowLeft } from 'lucide-react';

interface ScanResult {
  status: 'claimed_by_you' | 'already_taken' | 'invalid' | 'round_over' | 'not_started';
  evidence?: {
    title: string;
    content: string;
    category: string;
    code: string;
    points_value: number;
    flavor_text: string;
    reveal_delay_seconds: number;
  };
  claimer?: string;
  message?: string;
}

const CATEGORY_COLORS: Record<string, { badge: string; glow: string; label: string }> = {
  clue:        { badge: 'bg-blue-900/80 text-blue-200 border-blue-500',  glow: 'shadow-blue-500/30',  label: '🔵 KEY CLUE' },
  witness:     { badge: 'bg-amber-900/80 text-amber-200 border-amber-500', glow: 'shadow-amber-500/30', label: '🟡 WITNESS STATEMENT' },
  document:    { badge: 'bg-green-900/80 text-green-200 border-green-500', glow: 'shadow-green-500/30', label: '🟢 DOCUMENT' },
  red_herring: { badge: 'bg-red-900/80 text-red-200 border-red-500',    glow: 'shadow-red-500/30',   label: '🔴 RED HERRING' },
};

export default function ScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code') || '';

  const [manualCode, setManualCode] = useState(codeFromUrl);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [codesRemaining, setCodesRemaining] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(0);

  const token = '';

  // Auto-claim if code is in URL
  useEffect(() => {
    if (codeFromUrl && token) {
      claimCode(codeFromUrl);
    }
  }, [codeFromUrl, token]);

  // Fetch live remaining count
  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/r1/status', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          const data = await res.json();
          setCodesRemaining(data.remaining);
        }
      } catch { /* silent */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
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
    if (!token) {
      sessionStorage.setItem('scan_redirect', window.location.href);
      navigate(`/login?redirect=/scan?code=${encodeURIComponent(code)}`);
      return;
    }
    setLoading(true);
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
      setResult({ status: 'invalid', message: 'Connection to CCU servers failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) claimCode(manualCode.trim());
  };

  const cat = result?.evidence?.category ? CATEGORY_COLORS[result.evidence.category] : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0a0805 0%, #1a0f05 50%, #0d0a06 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,3,2,0.9) 100%)' }} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <QrCode className="w-6 h-6 text-[#d4a017]" />
          <span className="text-[10px] font-black tracking-[0.5em] text-[#d4a017] uppercase">Round 1 — Living Crime Scene</span>
          <QrCode className="w-6 h-6 text-[#d4a017]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#f4e6c4] tracking-tight uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Evidence Claim Terminal
        </h1>
        {codesRemaining !== null && (
          <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="mt-2 text-sm font-mono text-[#d4a017]">
            ◆ {codesRemaining} evidence piece{codesRemaining !== 1 ? 's' : ''} remaining in the field ◆
          </motion.div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-lg">
        <div className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(160deg, #f5e6c8 0%, #e8d5a3 40%, #d4b87a 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 6px #5c3a1a, 0 0 0 8px #3d2510',
          }}
        >
          <div className="absolute -left-2 top-3 bottom-3 w-2 rounded-l" style={{ background: 'linear-gradient(to right, #2d1a0a, #5c3a1a)' }} />

          <div className="px-6 py-6">
            <form onSubmit={handleManualSubmit} className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-amber-900/70 mb-2 font-mono">
                Enter Evidence Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4a017]" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                    placeholder="EC-XXXX"
                    className="w-full pl-10 pr-4 py-3 text-sm font-black uppercase tracking-[0.3em] font-mono outline-none"
                    style={{
                      background: 'linear-gradient(to bottom, #2a1a0a, #1a0f05)',
                      border: '2px solid #8B6914',
                      borderRadius: '4px',
                      color: '#d4a017',
                    }}
                  />
                </div>
                <button type="submit" disabled={loading || !manualCode.trim()} className="px-5 py-3 text-sm font-black uppercase tracking-widest transition-all"
                  style={{
                    background: loading ? '#5c4008' : 'linear-gradient(to bottom, #d4a017, #8B6914)',
                    border: '2px solid #5c4008',
                    borderRadius: '4px',
                    color: '#1a0f05',
                  }}
                >
                  {loading ? '...' : 'CLAIM'}
                </button>
              </div>
            </form>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-2 border-[#d4a017] border-t-transparent rounded-full" />
                  <span className="text-[11px] font-mono text-amber-900/70 uppercase tracking-widest">Accessing CCU Files...</span>
                </motion.div>
              )}

              {result?.status === 'claimed_by_you' && (
                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                      <div>
                        <div className="text-[9px] font-black uppercase text-green-800">Evidence Secured</div>
                        <div className="text-lg font-black text-amber-950 leading-tight">{result.evidence?.title}</div>
                      </div>
                    </div>
                    {cat && (
                      <div className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase border-2 tracking-tighter ${cat.badge}`}>
                        {cat.label}
                      </div>
                    )}
                  </div>

                  <div className={`relative overflow-hidden rounded-lg p-4 bg-black/90 border border-amber-900/30 ${cat?.glow}`}>
                    <AnimatePresence>
                      {!revealed && (
                        <motion.div className="absolute inset-0 flex items-center justify-center bg-black/95 z-20" exit={{ opacity: 0 }}>
                           <span className="text-4xl font-black text-[#d4a017]">{revealCountdown}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                       <span className="text-[10px] font-mono text-[#d4a017]/40 uppercase tracking-widest">Digital Telemetry</span>
                       <span className="text-[10px] font-mono text-[#d4a017]/40 uppercase tracking-widest">Code: {result.evidence?.code}</span>
                    </div>
                    <pre className="text-[12px] font-mono text-[#f0d070] whitespace-pre-wrap leading-relaxed min-h-[100px]">
                        {result.evidence?.content}
                    </pre>
                  </div>
                  <div className="text-[10px] font-black uppercase text-amber-900/50 text-center tracking-widest">
                    +{result.evidence?.points_value} XP SECURED FOR UNIT
                  </div>
                </motion.div>
              )}

              {result?.status === 'already_taken' && (
                <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <Lock className="w-12 h-12 text-red-800 mx-auto mb-3" />
                  <div className="text-xl font-black text-amber-950 uppercase">Evidence Compromised</div>
                  <p className="text-sm font-mono text-amber-900/70 mt-1">Already secured by {result.claimer || 'another team'}.</p>
                </motion.div>
              )}

              {(result?.status === 'invalid' || result?.status === 'round_over' || result?.status === 'not_started') && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <AlertTriangle className="w-12 h-12 text-amber-800 mx-auto mb-3" />
                  <div className="text-xl font-black text-amber-950 uppercase">{result.status.replace('_', ' ')}</div>
                  <p className="text-sm font-mono text-amber-900/70 mt-1">{result.message || 'System rejection. Check credentials.'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <button onClick={() => navigate('/')} className="relative z-10 mt-8 text-[10px] font-black text-[#d4a017]/60 uppercase tracking-[0.3em] flex items-center gap-2 hover:text-[#d4a017] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Return to Bureau
      </button>
    </div>
  );
}
