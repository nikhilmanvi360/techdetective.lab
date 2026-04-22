import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
 Shield, Users, FileText, Plus, Settings,
 Activity, LogOut, ChevronRight, Zap
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
 <div className="min-h-screen flex bg-black">
 {/* CRT Overlays */}
 <div className="fixed inset-0 pointer-events-none z-40">
 <div className="scanline" />
 <div className="crt-vignette" />
 <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(239,68,68,0.01)_2px,rgba(239,68,68,0.01)_4px)]" />
 </div>

 {/* ── Sidebar ── */}
 <aside className="w-64 border-r border-[#8B1A1A]/20 flex flex-col bg-black/90 relative z-10">
 {/* Sidebar glow */}
 <div className="absolute inset-0 pointer-events-none"
 style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.04) 0%, transparent 50%)' }} />

 {/* Branding */}
 <div className="p-6 border-b border-[#8B1A1A]/20 relative z-10">
 <div className="flex items-center gap-3 mb-1">
 <div className="p-2 bg-[#8B1A1A]/5 border border-[#8B1A1A]/30">
 <Shield className="w-5 h-5 text-[#A52A2A]" />
 </div>
 <div>
 <div className="text-[10px] font-display text-[#A52A2A] uppercase tracking-[0.3em]">CCU Admin</div>
 <div className="text-white font-display font-bold text-sm uppercase tracking-widest">Command Center</div>
 </div>
 </div>

 <div className="mt-3 flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-[#8B1A1A] animate-pulse" />
 <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{team?.name || 'ADMIN'} // ELEVATED</span>
 </div>
 </div>

 {/* Nav Links */}
 <nav className="flex-1 p-4 space-y-1 relative z-10">
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
 className={`flex items-center gap-3 px-4 py-3 transition-all group relative ${
 active
 ? 'bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 text-[#A52A2A]'
 : 'border border-transparent text-gray-500 hover:text-white hover:border-[rgba(139,105,20,0.4)]'
 }`}
 >
 {active && (
 <motion.div
 layoutId="admin-nav-active"
 className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8B1A1A]"
 />
 )}
 <span className={active ? 'text-[#A52A2A]' : 'group-hover:text-white transition-colors'}>
 {item.icon}
 </span>
 <span className="text-xs font-display uppercase tracking-widest">{item.label}</span>
 {active && <ChevronRight className="w-3 h-3 ml-auto text-[#A52A2A]/50" />}
 </Link>
 );
 })}
 </nav>

 {/* Back to Game + Logout */}
 <div className="p-4 border-t border-[#8B1A1A]/10 space-y-2 relative z-10">
 <Link to="/" onClick={() => playSound('click')}
 className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-white border border-transparent hover:border-[rgba(139,105,20,0.4)] transition-all text-xs font-display uppercase tracking-widest">
 <Zap className="w-3 h-3" /> Back to Game
 </Link>
 <button onClick={handleLogout}
 className="w-full flex items-center gap-3 px-4 py-2 text-[#A52A2A]/50 hover:text-[#A52A2A] border border-transparent hover:border-[#8B1A1A]/30 transition-all text-xs font-display uppercase tracking-widest">
 <LogOut className="w-3 h-3" /> Disconnect
 </button>
 </div>
 </aside>

 {/* ── Main Content ── */}
 <main className="flex-1 flex flex-col relative z-10">
 <AnimatePresence mode="wait">
 <motion.div
 key={location.pathname}
 initial={{ opacity: 0, x: 10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 transition={{ duration: 0.25 }}
 className="flex-1 p-10 overflow-y-auto custom-scrollbar"
 >
 <Outlet />
 </motion.div>
 </AnimatePresence>
 </main>
 </div>
 );
}
