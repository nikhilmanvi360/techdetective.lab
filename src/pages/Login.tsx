import React, { useState } from 'react';
import { Fingerprint, Shield, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';
import { useSound } from '../hooks/useSound';

interface LoginProps {
  onLogin: (team: Team) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'detective' | 'analyst'>('detective');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { playSound } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, password, role }),
      });

      if (response.ok) {
        const data = await response.json();
        playSound('success');
        setTimeout(() => onLogin(data.team), 400);
      } else {
        const data = await response.json();
        playSound('error');
        setError(data.error || 'Identity Verification Failed');
        setLoading(false);
      }
    } catch {
      playSound('error');
      setError('Connection Link Severed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-black overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/assets/login-bg.png')] bg-cover bg-center opacity-30 grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="scanline" />
        <div className="crt-vignette opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel p-1 border-2 border-[#3a2810]">
          <div className="bg-[#0c0e0b] p-8 border border-[#d4a017]/20 relative overflow-hidden">
            {/* Decorative Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4a017]/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4a017]/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4a017]/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4a017]/30" />

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-[#d4a017]/10 border-2 border-[#d4a017] shadow-[0_0_20px_rgba(212,160,23,0.2)]">
                <Shield className="w-10 h-10 text-[#d4a017]" />
              </div>
              <h1 className="text-3xl font-black text-[#f5e6c8] uppercase tracking-tighter mb-2">Bureau <span className="text-[#d4a017]">Access</span></h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
                <span className="text-[10px] font-mono font-black text-[#a07830] uppercase tracking-[0.4em]">CCU_PROTOCOL_v4.2</span>
              </div>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-2 mb-8 bg-black/40 p-1 border border-[#3a2810]">
              {(['detective', 'analyst'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { playSound('click'); setRole(r); }}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    role === r 
                      ? 'bg-[#d4a017] text-black shadow-[0_0_15px_rgba(212,160,23,0.3)]' 
                      : 'text-[#a07830] hover:text-[#d4a017] hover:bg-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="team-name" className="text-[9px] font-black text-[#a07830] uppercase tracking-[0.4em] ml-1">Identity Token</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4a017]" />
                  <input
                    id="team-name"
                    name="team-name"
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="ENTER TEAM CALLSIGN"
                    className="w-full bg-black/40 border-2 border-[#3a2810] pl-12 pr-4 py-4 text-xs font-mono font-black text-[#f0d070] focus:border-[#d4a017] outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="access-cipher" className="text-[9px] font-black text-[#a07830] uppercase tracking-[0.4em] ml-1">Access Cipher</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4a017]" />
                  <input
                    id="access-cipher"
                    name="access-cipher"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border-2 border-[#3a2810] pl-12 pr-4 py-4 text-xs font-mono font-black text-[#f0d070] focus:border-[#d4a017] outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-900/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="detective-button w-full"
              >
                {loading ? 'Verifying Link...' : (
                  <>
                    <Zap className="w-4 h-4" /> Initialize Session
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex justify-between items-center text-[8px] font-black text-[#a07830]/40 uppercase tracking-[0.3em]">
              <span>Link Status: Secure</span>
              <span>Prot: TLS 1.3 / JWT</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
