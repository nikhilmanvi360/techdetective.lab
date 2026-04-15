import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Lock, User, Terminal, Cpu, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';
import { useSound } from '../hooks/useSound';

interface LoginProps {
  onLogin: (team: Team, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const { playSound } = useSound();

  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * 10}s`,
    }));
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + Math.random() * 10 : p));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        playSound('success');
        setProgress(100);
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
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg p-6 overflow-hidden relative">
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              '--x': p.x,
              '--duration': p.duration,
              '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Visual Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="scanline" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-cyber-green/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cyber-blue/5 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg z-10"
      >
        <div className="cyber-panel neon-border-green shadow-2xl overflow-hidden gradient-border corner-brackets">
          {/* Header HUD */}
          <div className="bg-black/80 px-6 py-4 border-b border-cyber-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-cyber-green/30 relative">
                <ShieldAlert className="w-5 h-5 text-cyber-green flicker-anim" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-display font-bold text-cyber-green uppercase tracking-[0.3em]">System_Auth_Protocol</span>
                <span className="text-[8px] font-mono text-gray-600 uppercase">Secure Entry Node #127.0.0.1</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-cyber-red/50" />
              <div className="w-1.5 h-1.5 bg-cyber-amber/50" />
              <div className="w-1.5 h-1.5 bg-cyber-green animate-pulse" />
            </div>
          </div>

          <div className="p-10 relative">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-display font-bold text-white mb-3 tracking-[0.1em] glitch-text">
                CENTRAL_OPS<span className="text-cyber-green">.LOG</span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] flex-1 max-w-12 bg-gradient-to-r from-transparent to-cyber-green/50" />
                <p className="text-gray-500 text-[10px] font-display uppercase tracking-[0.4em]">Establish Secure Link</p>
                <div className="h-[1px] flex-1 max-w-12 bg-gradient-to-l from-transparent to-cyber-green/50" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-cyber-blue" />
                    <label className="text-[10px] font-display text-cyber-blue uppercase tracking-widest">Team_ID</label>
                  </div>
                  <div className="relative group">
                    <input 
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="cyber-input w-full pl-4 border-l-2 border-l-cyber-blue/30 group-focus-within:border-l-cyber-blue"
                      placeholder="IDENTIFIER"
                    />
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 group-focus-within:w-full bg-cyber-blue transition-all duration-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-cyber-green" />
                    <label className="text-[10px] font-display text-cyber-green uppercase tracking-widest">Access_Hex</label>
                  </div>
                  <div className="relative group">
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="cyber-input w-full pl-4 border-l-2 border-l-cyber-green/30 group-focus-within:border-l-cyber-green"
                      placeholder="••••••••"
                    />
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 group-focus-within:w-full bg-cyber-green transition-all duration-500" />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-cyber-red/10 border border-cyber-red/30 flex items-center gap-4"
                  >
                    <Activity className="w-5 h-5 text-cyber-red flicker-anim" />
                    <div className="flex-1">
                      <div className="text-[10px] font-display text-cyber-red uppercase tracking-widest">Link_Failure</div>
                      <div className="text-xs font-mono text-white/80">{error}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-cyber-line">
                <button 
                  type="submit"
                  disabled={loading}
                  className={`cyber-button w-full h-14 flex items-center justify-center gap-3 group transition-all ${
                    loading ? 'bg-cyber-green/5 border-cyber-green/20' : 'cyber-button-green cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <div className="w-full bg-cyber-line h-1 mb-2 overflow-hidden">
                        <motion.div 
                          className="bg-cyber-green h-full"
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-display tracking-[0.3em] flicker-anim">UPLOADING_CREDENTIALS_{Math.floor(progress)}%</span>
                    </div>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 group-hover:fill-current" />
                      <span className="text-lg font-display">OPEN_COMMAND_LINK</span>
                      <Terminal className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 border-t border-cyber-line pt-8">
              <div className="flex flex-col items-center border-r border-cyber-line">
                <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest mb-1">Status</span>
                <span className="text-[10px] font-display text-cyber-green">READY</span>
              </div>
              <div className="flex flex-col items-center border-r border-cyber-line">
                <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest mb-1">Enc</span>
                <span className="text-[10px] font-display text-cyber-blue">2048-BIT</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest mb-1">Link</span>
                <span className="text-[10px] font-display text-cyber-amber">DIRECT</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-display text-gray-700 uppercase tracking-[0.5em]">
          All activities monitored by CCU intelligence agency
        </p>
      </motion.div>
    </div>
  );
}
