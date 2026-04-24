import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Users, Copy, Check, LogIn, Wifi, WifiOff } from 'lucide-react';
import { useCampaign } from '../../engine/campaignStore';

interface SessionLobbyProps {
  sessionCode: string | null;
  isHost: boolean;
  partnerConnected: boolean;
  onCreate: () => void;
  onJoin: (code: string) => Promise<boolean>;
  onStart: () => void;
}

export default function SessionLobby({ sessionCode, isHost, partnerConnected, onCreate, onJoin, onStart }: SessionLobbyProps) {
  const { state } = useCampaign();
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'select' | 'host' | 'client'>('select');

  // If game has already started (roles set), don't show lobby
  if (state.teamRoles !== null) return null;

  const handleCopy = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateClick = () => {
    setMode('host');
    onCreate();
  };

  const handleJoinClick = async () => {
    if (joinCode.length === 6) {
      const joined = await onJoin(joinCode);
      if (joined) {
        setMode('client');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0702]/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[600px] shadow-2xl relative overflow-hidden flex flex-col"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")',
          backgroundColor: '#e8d5a0',
          border: '4px solid #a07830'
        }}
      >
        <div className="text-center py-8 border-b-4 border-[#a07830] relative bg-[#2a1a0a]">
          <ShieldAlert className="w-12 h-12 text-[#d4a017] mx-auto mb-2" />
          <h2 className="text-3xl font-black text-[#d4a017] uppercase tracking-widest">Digital Crime Lab</h2>
          <p className="text-[#a07830] font-serif mt-2 tracking-wide text-sm">Secure Terminal Link</p>
        </div>

        <div className="p-8">
          {mode === 'select' && (
            <div className="flex gap-6">
              <button 
                onClick={handleCreateClick}
                className="flex-1 bg-[#2a1a0a] text-[#d4a017] border-2 border-[#a07830] p-6 hover:bg-[#a07830] hover:text-[#2a1a0a] transition-all flex flex-col items-center gap-3"
              >
                <Users className="w-8 h-8" />
                <span className="font-black uppercase tracking-widest">Create Session</span>
                <span className="text-xs font-serif opacity-80 text-center">Host a new case and invite a partner.</span>
              </button>
              
              <div className="flex-1 flex flex-col gap-3">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-Letter Code"
                  maxLength={6}
                  className="w-full bg-[#1a0f0a] text-[#d4a017] border-2 border-[#a07830] p-4 text-center text-xl tracking-[0.5em] font-black focus:outline-none focus:border-[#d4a017]"
                />
                <button 
                  onClick={handleJoinClick}
                  disabled={joinCode.length !== 6}
                  className="w-full bg-[#2a1a0a] text-[#d4a017] border-2 border-[#a07830] p-4 hover:bg-[#a07830] hover:text-[#2a1a0a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-black uppercase tracking-widest">Join Session</span>
                </button>
              </div>
            </div>
          )}

          {(mode === 'host' || mode === 'client') && (
            <div className="flex flex-col items-center space-y-8">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-[#8B2020] mb-2">
                  Session Active
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-[#1a0f0a] border-2 border-[#a07830] px-8 py-4">
                    <span className="text-4xl font-black text-[#d4a017] tracking-[0.25em]">
                      {sessionCode || '------'}
                    </span>
                  </div>
                  {isHost && (
                    <button 
                      onClick={handleCopy}
                      className="p-4 bg-[#2a1a0a] text-[#d4a017] border-2 border-[#a07830] hover:bg-[#a07830] hover:text-[#2a1a0a] transition-colors"
                    >
                      {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </button>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-3 px-6 py-3 border-2 ${partnerConnected ? 'border-[#5a7a4a] bg-[#5a7a4a]/10' : 'border-[#8B2020] bg-[#8B2020]/10'}`}>
                {partnerConnected ? (
                  <>
                    <Wifi className="w-5 h-5 text-[#5a7a4a]" />
                    <span className="font-black uppercase tracking-widest text-[#5a7a4a]">Secure Link Established</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-[#8B2020]" />
                    <span className="font-black uppercase tracking-widest text-[#8B2020]">Waiting for Partner...</span>
                  </>
                )}
              </div>

              {isHost ? (
                <button
                  onClick={onStart}
                  disabled={!partnerConnected}
                  className="w-full py-4 border-4 border-[#2a1a0a] text-lg font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#2a1a0a] text-[#d4a017] hover:bg-[#a07830] hover:text-[#2a1a0a]"
                >
                  Initiate Investigation
                </button>
              ) : (
                <p className="text-sm font-serif text-[#a07830] italic">Waiting for host to start...</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
