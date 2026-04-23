import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Lock, User, FileText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Detective_Zero', id: '1' }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#140e06] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Texture Overlays */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-linen.png")' }} />
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />

      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full bg-[#f0e0a0] border-[12px] border-[#3a2810] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
      >
        {/* Brass Header Badge */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#d4a017] to-[#8B6914] px-6 py-2 border-2 border-[#f0d070] text-[#140e06] font-black uppercase tracking-[0.4em] text-[10px] shadow-lg">
           Authorized Personnel
        </div>

        <div className="text-center mb-10">
           <FileText className="w-12 h-12 text-[#3a2810] mx-auto mb-4 opacity-40" />
           <h1 className="text-3xl font-black text-[#2a1a0a] uppercase tracking-tighter mb-2 font-serif italic">Investigation Unit</h1>
           <div className="h-1 bg-[#8B2020] w-1/3 mx-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="space-y-2">
              <label className="text-[10px] text-[#a07830] uppercase font-black tracking-widest border-b border-[#a07830]/20 pb-1 flex justify-between">
                 <span>Detective ID</span>
                 <span className="font-mono opacity-40">REF: 8023-A</span>
              </label>
              <div className="relative">
                 <User className="absolute left-0 top-2.5 w-5 h-5 text-[#3a2810]/30" />
                 <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#3a2810]/20 px-8 py-2 text-[#2a1a0a] font-serif italic focus:outline-none focus:border-[#d4a017] transition-all placeholder-[#3a2810]/20"
                    placeholder="Enter designation..."
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] text-[#a07830] uppercase font-black tracking-widest border-b border-[#a07830]/20 pb-1 flex justify-between">
                 <span>Clearance Key</span>
                 <span className="font-mono opacity-40">SECURE_LINK</span>
              </label>
              <div className="relative">
                 <Lock className="absolute left-0 top-2.5 w-5 h-5 text-[#3a2810]/30" />
                 <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#3a2810]/20 px-8 py-2 text-[#2a1a0a] focus:outline-none focus:border-[#d4a017] transition-all"
                    placeholder="••••••••"
                 />
              </div>
           </div>

           <button 
              type="submit"
              className="w-full group bg-[#2a1a0a] hover:bg-[#3d2610] py-4 text-[#f0e0a0] font-black uppercase tracking-[0.3em] text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border-2 border-[#a07830]"
           >
              Establish Connection <Shield className="w-4 h-4 text-[#d4a017]" />
           </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-2 opacity-30 select-none">
           <div className="text-[8px] uppercase font-black tracking-[0.4em] text-[#3a2810]">London Metropolitan Dept</div>
           <p className="font-serif italic text-[10px] text-[#3a2810]">"In Pulvere Invenimus"</p>
        </div>
      </motion.div>
    </div>
  );
}
