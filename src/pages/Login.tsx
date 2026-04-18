import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';
import { useSound } from '../hooks/useSound';
import { Shield, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (team: Team, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'hacker' | 'analyst'>('hacker');
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
      const data = await response.json();

      if (response.ok) {
        playSound('success');
        setTimeout(() => onLogin(data.team, data.token), 500);
      } else {
        playSound('error');
        setError(data.error || 'Identity Verification Failed');
        setLoading(false);
      }
    } catch (err) {
      playSound('error');
      setError('Connection Link Severed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center relative" style={{ backgroundImage: "url('/background.png')" }}>
      {/* Dark overlay for mood */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="paper-card p-10 relative">
          <div className="pushpin top-4 left-1/2 -translate-x-1/2" />
          <div className="stamp absolute top-8 right-8 rotate-12 scale-125 border-[#8b0000] text-[#8b0000]">TOP_SECRET</div>

          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl font-display font-bold text-black mb-2 uppercase tracking-tighter">
              RESTRICTED_ACCESS
            </h1>
            <div className="w-16 h-1 border-t-2 border-black mx-auto mb-4" />
            <p className="text-gray-700 text-sm typewriter-text uppercase tracking-widest border-b border-dashed border-gray-400 pb-2">
              Identity Verification Required
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Role Radio Buttons - Made to look like checkbox forms */}
            <div className="flex gap-4 mb-2">
              <label className="flex-1 border-2 border-black p-3 flex items-center gap-3 cursor-pointer group hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                <input 
                  type="radio" 
                  name="role" 
                  value="hacker" 
                  checked={role === 'hacker'} 
                  onChange={() => { playSound('click'); setRole('hacker'); }}
                  className="w-4 h-4 accent-black" 
                />
                <span className="font-display font-bold uppercase text-black text-sm">Hacker Intel</span>
              </label>
              <label className="flex-1 border-2 border-black p-3 flex items-center gap-3 cursor-pointer group hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                <input 
                  type="radio" 
                  name="role" 
                  value="analyst" 
                  checked={role === 'analyst'} 
                  onChange={() => { playSound('click'); setRole('analyst'); }}
                  className="w-4 h-4 accent-black" 
                />
                <span className="font-display font-bold uppercase text-black text-sm">Analyst Desk</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> clearance_id
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-black p-2 font-display text-xl text-black focus:outline-none focus:border-[#8b0000] uppercase placeholder-gray-400"
                  placeholder="IDENTIFIER..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> passcode_hex
              </label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-black p-2 font-display text-xl text-black focus:outline-none focus:border-[#8b0000] uppercase placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2"
                >
                  <div className="border border-[#8b0000] bg-[#8b0000]/10 p-3 flex items-start gap-3">
                    <span className="stamp !p-1 !text-[10px] !border-2">REJECTED</span>
                    <div className="typewriter-text text-[#8b0000] text-xs pt-1">{error}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full border-[3px] border-black bg-transparent font-display font-bold text-black uppercase tracking-widest py-4 hover:bg-black hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'PROCESSING_CLEARANCE...' : 'AUTHORIZE_ACCESS'}
              </button>
            </div>
            
            <div className="pt-4 text-center">
              <p className="typewriter-text text-[10px] text-gray-400">UNAUTHORIZED ACCESS WILL BE LOGGED AND TRACED.</p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
