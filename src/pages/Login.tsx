import React, { useState } from 'react';
import { Coffee, Fingerprint, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';
import { useSound } from '../hooks/useSound';

interface LoginProps {
 onLogin: (team: Team, token: string) => void;
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

 const data = await response.json();

 if (response.ok) {
 playSound('success');
 setTimeout(() => onLogin(data.team, data.token), 400);
 } else {
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
 <div
 className="min-h-screen flex items-center justify-center overflow-hidden relative"
 style={{
 backgroundImage: 'url(/assets/detective_desk_bg.png)',
 backgroundSize: 'cover',
 backgroundPosition: 'center top',
 }}
 >
 {/* Darkening overlay so the form stands out */}
 <div className="absolute inset-0 bg-black/40" />

 {/* Main card — styled as a leather-bound case file */}
 <motion.div
 initial={{ opacity: 0, y: 30, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ duration: 0.7, ease: 'easeOut' }}
 className="relative z-10 w-full max-w-md mx-4"
 style={{
 background: 'linear-gradient(160deg, #f5e6c8 0%, #e8d5a3 40%, #d4b87a 100%)',
 boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 8px #5c3a1a, 0 0 0 10px #3d2510, inset 0 1px 0 rgba(255,255,255,0.3)',
 borderRadius: '4px',
 }}
 >
 {/* Leather spine effect - left side */}
 <div
 className="absolute -left-3 top-2 bottom-2 w-3 rounded-l"
 style={{ background: 'linear-gradient(to right, #2d1a0a, #5c3a1a)' }}
 />

 {/* Stitching top & bottom */}
 <div className="absolute top-2 left-4 right-4 h-px border-t border-dashed border-amber-900/30" />
 <div className="absolute bottom-2 left-4 right-4 h-px border-t border-dashed border-amber-900/30" />

 <div className="px-8 py-8">
 {/* Badge + Header */}
 <div className="text-center mb-6">
 {/* CBI Badge simulation */}
 <div
 className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-xl"
 style={{
 background: 'radial-gradient(circle at 30% 30%, #d4a017, #8B6914, #5c4008)',
 boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
 border: '3px solid #a07830',
 }}
 >
 <span className="text-xs font-bold tracking-widest text-amber-100" style={{ fontFamily: 'serif' }}>CCU</span>
 </div>

 <h1
 className="text-base font-bold tracking-widest text-amber-900 uppercase leading-tight"
 style={{ fontFamily:"'Georgia', serif", textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
 >
 K.L.E. CYBER CRIMES UNIT<br />
 <span className="text-sm font-normal">— SECURE ACCESS PORTAL —</span>
 </h1>
 <p className="text-[10px] text-amber-800/70 mt-1 font-mono">
 Secure Entry Mode: CCU-HQ (localhost:5173/login)
 </p>
 </div>

 {/* Role Selector Buttons */}
 <div className="grid grid-cols-2 gap-3 mb-5">
 <button
 type="button"
 onClick={() => { playSound('click'); setRole('detective'); }}
 className="flex flex-col items-center gap-1 py-3 px-2 transition-all"
 style={{
 background: role === 'detective'
 ? 'linear-gradient(to bottom, #c8a050, #8B6914)'
 : 'linear-gradient(to bottom, #d4b87a, #c4a060)',
 border: '2px solid #8B6914',
 boxShadow: role === 'detective' ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
 borderRadius: '3px',
 color: '#3d2510',
 }}
 >
 <Coffee className="w-5 h-5" />
 <span className="text-[10px] font-bold uppercase tracking-wider">Consultant<br />Portal</span>
 </button>

 <button
 type="button"
 onClick={() => { playSound('click'); setRole('analyst'); }}
 className="flex flex-col items-center gap-1 py-3 px-2 transition-all"
 style={{
 background: role === 'analyst'
 ? 'linear-gradient(to bottom, #c8a050, #8B6914)'
 : 'linear-gradient(to bottom, #d4b87a, #c4a060)',
 border: '2px solid #8B6914',
 boxShadow: role === 'analyst' ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
 borderRadius: '3px',
 color: '#3d2510',
 }}
 >
 <Fingerprint className="w-5 h-5" />
 <span className="text-[10px] font-bold uppercase tracking-wider">Field Operative<br />Console</span>
 </button>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Team / ID field */}
 <div>
 <div className="flex items-center gap-1 mb-1">
 <User className="w-3 h-3 text-amber-900/70" />
  <label htmlFor="login-id" className="text-[10px] font-bold uppercase tracking-widest text-amber-900/80" style={{ fontFamily: 'monospace' }}>
 Identification Number
 </label>
 </div>
 <input
 type="text"
 required
 value={teamName}
 onChange={(e) => setTeamName(e.target.value)}
   id="login-id"
  name="login-id"
  placeholder="IDENTIFIER"
 className="w-full px-4 py-3 text-sm font-bold uppercase tracking-wider outline-none"
 style={{
 background: 'linear-gradient(to bottom, #2a1a0a, #1a0f05)',
 border: '2px solid #8B6914',
 borderRadius: '3px',
 color: '#d4a017',
 caretColor: '#d4a017',
 fontFamily: 'monospace',
 boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
 }}
 />
 </div>

 {/* Password field */}
 <div>
 <div className="flex items-center gap-1 mb-1">
 <span className="text-amber-900/70 text-xs">🔒</span>
  <label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-widest text-amber-900/80" style={{ fontFamily: 'monospace' }}>
 Access Code
 </label>
 </div>
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
   id="login-password"
  name="login-password"
  placeholder="••••••••"
 className="w-full px-4 py-3 text-sm font-bold outline-none"
 style={{
 background: 'linear-gradient(to bottom, #2a1a0a, #1a0f05)',
 border: '2px solid #8B6914',
 borderRadius: '3px',
 color: '#d4a017',
 caretColor: '#d4a017',
 fontFamily: 'monospace',
 boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
 }}
 />
 </div>

 {/* Error */}
 <AnimatePresence>
 {error && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="text-xs font-mono text-red-800 bg-red-100/80 border border-red-400 px-3 py-2 rounded-sm"
 >
 ⚠ {error}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Login button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full py-4 text-base font-bold uppercase tracking-[0.4em] transition-all mt-2"
 style={{
 background: loading
 ? 'linear-gradient(to bottom, #a07830, #6b5020)'
 : 'linear-gradient(to bottom, #d4a017, #8B6914)',
 border: '2px solid #5c4008',
 borderRadius: '3px',
 color: '#1a0f05',
 fontFamily:"'Georgia', serif",
 boxShadow: loading
 ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
 : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
 letterSpacing: '0.3em',
 }}
 >
 {loading ? 'VERIFYING...' : 'LOG IN'}
 </button>
 </form>

 {/* Footer status bar */}
 <div className="mt-6 pt-4 border-t border-amber-900/30">
 <div className="grid grid-cols-3 text-center gap-2">
 {[
 { label: 'STATUS:', value: 'AUTHENTICATION\nREADY' },
 { label: 'ENC:', value: '2048-BIT\nSECURED' },
 { label: 'LINK:', value: 'DIRECT\nCCU ENCRYPTED' },
 ].map(({ label, value }) => (
 <div key={label}>
 <div className="text-[8px] font-mono text-amber-900/60 uppercase">{label}</div>
 <div className="text-[9px] font-mono font-bold text-amber-900/90 whitespace-pre-line leading-tight">{value}</div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Footer stamp */}
 <div
 className="px-8 py-3 text-center text-[9px] font-mono tracking-widest uppercase border-t"
 style={{
 borderColor: 'rgba(92, 58, 26, 0.3)',
 color: 'rgba(92, 58, 26, 0.7)',
 background: 'rgba(0,0,0,0.08)',
 }}
 >
 CCU Internal Affairs Division — Case Management System ©2026
 </div>
 </motion.div>
 </div>
 );
}
