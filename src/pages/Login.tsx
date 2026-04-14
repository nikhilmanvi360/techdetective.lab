import React, { useState } from 'react';
import { ShieldAlert, Lock, User, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { Team } from '../types';

interface LoginProps {
  onLogin: (team: Team, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        onLogin(data.team, data.token);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg p-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-terminal-green/20" />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="terminal-card shadow-2xl shadow-terminal-green/5">
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-terminal-green" />
              <span className="text-xs font-mono font-bold text-terminal-green uppercase tracking-widest">System Authentication</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-terminal-line" />
              <div className="w-2 h-2 rounded-full bg-terminal-line" />
              <div className="w-2 h-2 rounded-full bg-terminal-green" />
            </div>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-mono font-bold text-white mb-2 tracking-tighter">
                TECH_DETECTIVE<span className="text-terminal-green">.LAB</span>
              </h1>
              <p className="text-gray-500 text-sm font-mono">Enter credentials to access the Digital Crime Lab</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Team Identifier</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="TEAM_NAME"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-mono"
                >
                  ERROR: {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="terminal-button w-full py-3 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span className="animate-pulse">AUTHENTICATING...</span>
                ) : (
                  <>
                    INITIATE_SESSION
                    <Terminal className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-terminal-line text-center">
              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Authorized Personnel Only. All actions are logged.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
