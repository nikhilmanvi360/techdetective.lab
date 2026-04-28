import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, FileText, Plus, Settings,
  Activity, LogOut, ChevronRight, Zap, QrCode, HardDrive
} from 'lucide-react';
import { Team } from '../../types';
import { useSound } from '../../hooks/useSound';

interface AdminLayoutProps {
  team: Team | null;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: <Activity className="w-4 h-4" />, exact: true },
  { to: '/admin/submissions', label: 'Submissions', icon: <FileText className="w-4 h-4" /> },
  { to: '/admin/teams', label: 'Teams', icon: <Users className="w-4 h-4" /> },
  { to: '/admin/round3', label: 'Round 3 Control', icon: <HardDrive className="w-4 h-4 text-red-500" /> },
  { to: '/admin/builder', label: 'Case Builder', icon: <Plus className="w-4 h-4" /> },
  { to: '/admin/system', label: 'System', icon: <Settings className="w-4 h-4" /> },
];

export default function AdminLayout({ team, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const handleLogout = () => {
    playSound('error');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#0c0803] text-[#f4e6c4] selection:bg-[#d4a017] selection:text-black">
      {/* Immersive Overlays */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="scanline" />
        <div className="crt-vignette opacity-50" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(212,160,23,0.01)_2px,rgba(212,160,23,0.01)_4px)]" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-72 border-r-4 border-[#3a2810] flex flex-col bg-[#140e06] relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        {/* Sidebar Texture/Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.05) 0%, transparent 70%)' }} />

        {/* Branding - High Fidelity Brass/Badge Look */}
        <div className="p-8 border-b-2 border-[#3a2810] relative z-10 bg-gradient-to-b from-[#1a1209] to-[#140e06]">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 group">
               <div className="absolute inset-0 bg-[#d4a017] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
               <div className="relative p-4 bg-gradient-to-br from-[#d4a017] to-[#8B6914] border-2 border-[#f0d070] shadow-[0_0_15px_rgba(212,160,23,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Shield className="w-8 h-8 text-[#140e06]" strokeWidth={2.5} />
               </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.5em] leading-none mb-1">Central Control</div>
              <div className="text-xl font-display font-black uppercase tracking-widest text-[#f0d070] drop-shadow-lg">
                Admin <span className="text-[#f4e6c4]">Bureau</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 px-3 py-1 bg-black/40 border border-[#3a2810] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
            <span className="text-[9px] font-mono text-[#a07830] uppercase tracking-[0.2em] font-bold">
              {team?.name || 'ROOT'} // ELEVATED_ACCESS
            </span>
          </div>
        </div>

        {/* Nav Links - Professional Sidebar Style */}
        <nav className="flex-1 p-6 space-y-2 relative z-10 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== '/admin';
            const isActiveExact = item.exact && location.pathname === item.to;
            const active = isActive || isActiveExact;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => playSound('click')}
                className={`flex items-center gap-4 px-5 py-4 transition-all group relative border ${
                  active
                    ? 'bg-gradient-to-r from-[#d4a017]/10 to-transparent border-[#d4a017]/40 text-[#f0d070] shadow-[inset_4px_0_0_#d4a017]'
                    : 'border-transparent text-[#a07830]/60 hover:text-[#f4e6c4] hover:bg-white/5'
                }`}
              >
                <span className={`transition-colors ${active ? 'text-[#f0d070]' : 'group-hover:text-[#f0d070]'}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto text-[#d4a017]/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Back to Game + Logout */}
        <div className="p-6 border-t-2 border-[#3a2810] space-y-3 relative z-10 bg-[#0c0803]">
          <Link to="/" onClick={() => playSound('click')}
            className="flex items-center justify-center gap-3 w-full py-3 bg-[#2a1a0a] border border-[#d4a017]/30 text-[#d4a017] hover:bg-[#d4a017] hover:text-[#0c0803] transition-all text-[10px] font-black uppercase tracking-widest group">
            <Zap className="w-3 h-3 transition-transform group-hover:scale-125" /> Terminal View
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 border border-red-900/30 text-red-700/60 hover:text-red-500 hover:border-red-900/60 transition-all text-[10px] font-black uppercase tracking-widest">
            <LogOut className="w-3 h-3" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Content Header (Subtle Paper Texture) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[-1]"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 p-12 overflow-y-auto custom-scrollbar"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c0803;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3a2810;
          border-radius: 4px;
          border: 2px solid #0c0803;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4a017;
        }
      `}</style>
    </div>
  );
}
