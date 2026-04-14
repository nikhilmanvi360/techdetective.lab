import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Terminal, LogOut, LayoutDashboard, Trophy, ShieldAlert, User, Shield } from 'lucide-react';
import { Team } from '../types';
import { motion } from 'motion/react';
import LiveTicker from './LiveTicker';
import { getRankTitle, getRankColor } from '../utils/ranks';

interface LayoutProps {
  team: Team | null;
  onLogout: () => void;
}

export default function Layout({ team, onLogout }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-terminal-line bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-terminal-green/10 rounded border border-terminal-green/30 group-hover:border-terminal-green transition-colors">
              <ShieldAlert className="w-6 h-6 text-terminal-green" />
            </div>
            <span className="font-mono font-bold text-lg tracking-tighter text-white">
              TECH_DETECTIVE<span className="text-terminal-green">.LAB</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-sm font-mono hover:text-terminal-green transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              DASHBOARD
            </Link>
            <Link to="/scoreboard" className="flex items-center gap-2 text-sm font-mono hover:text-terminal-green transition-colors">
              <Trophy className="w-4 h-4" />
              SCOREBOARD
            </Link>
            <Link to="/profile" className="flex items-center gap-2 text-sm font-mono hover:text-terminal-green transition-colors">
              <User className="w-4 h-4" />
              PROFILE
            </Link>
            {team?.name === 'CCU_ADMIN' && (
              <Link to="/admin" className="flex items-center gap-2 text-sm font-mono text-red-500 hover:text-red-400 transition-colors">
                <Shield className="w-4 h-4" />
                ADMIN
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-mono text-gray-500 uppercase">Investigator</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-terminal-green font-bold">{team?.name || 'UNKNOWN'}</span>
                {team && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border border-current ${getRankColor(team.score)}`}>
                    {getRankTitle(team.score)}
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-[1px] bg-terminal-line mx-2 hidden sm:block" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono text-gray-500 uppercase">Score</span>
              <span className="text-sm font-mono text-white font-bold">{team?.score || 0}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
              data-tooltip="Terminate Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-terminal-line py-6 bg-black/20 pb-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <Terminal className="w-3 h-3" />
            SYSTEM_STATUS: <span className="text-terminal-green">OPERATIONAL</span>
          </div>
          <p className="text-xs font-mono text-gray-600">
            &copy; 2026 DIGITAL CRIME LAB | CYBER INVESTIGATION PLATFORM
          </p>
        </div>
      </footer>

      {team && <LiveTicker />}
    </div>
  );
}
