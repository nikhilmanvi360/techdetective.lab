import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Play, ChevronLeft, Clock } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export default function InvestigationRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { playSound } = useSound();
  
  const [detectives, setDetectives] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<any>({ state: 'LOBBY', round: 0 });
  const [timer, setTimer] = useState(0);

  const team = JSON.parse(localStorage.getItem('team') || '{}');

  useEffect(() => {
    const s = io(window.location.origin);
    setSocket(s);

    s.emit('join_investigation', { roomCode: code, teamName: team.name });

    s.on('detective_joined', ({ teamName }) => {
      setDetectives(prev => [...new Set([...prev, teamName])]);
      playSound('click');
    });

    s.on('game_state_update', (newState) => {
      setGameState(newState);
      if (newState.currentState) {
        localStorage.setItem('active_round', newState.currentState);
      }
      if (newState.state !== 'LOBBY' && newState.currentState !== 'LOBBY') {
        playSound('success');
      }
    });

    s.on('game_timer_update', ({ secondsRemaining }) => {
      setTimer(secondsRemaining);
    });

    s.on('mission_started', () => {
      playSound('success');
    });

    // Fetch initial room data
    fetch(`/api/rooms/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ roomCode: code })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        navigate('/lobby');
      } else {
        setIsHost(data.host_id === team.id || team.name === 'CCU_ADMIN');
        setDetectives(data.players || [team.name]); 
      }
    })
    .finally(() => setLoading(false));

    return () => { s.disconnect(); };
  }, [code, navigate, team.id, team.name, playSound]);

  const handleLaunch = () => {
    if (socket) {
      playSound('ping');
      socket.emit('launch_investigation', { roomCode: code });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-[#140e06] flex items-center justify-center text-[#d4a017] uppercase tracking-widest">Opening Dossier...</div>;

  return (
    <div className="min-h-screen bg-[#140e06] flex items-center justify-center p-4">
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
       
       <motion.div 
          initial={{ rotateX: -20, opacity: 0 }} 
          animate={{ rotateX: 0, opacity: 1 }}
          className="relative max-w-5xl w-full flex flex-col md:flex-row bg-[#e8d5a0] border-[12px] border-[#a07830] shadow-[0_40px_100px_rgba(0,0,0,0.6)] min-h-[600px] overflow-hidden"
       >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
          
          <div className="absolute -top-[52px] left-8 px-8 py-3 bg-[#e8d5a0] border-t-[12px] border-x-[12px] border-[#a07830] text-[#2a1a0a] font-black uppercase text-sm tracking-widest">
             Case File: {code}
          </div>

          <div className="flex-1 p-10 border-r-4 border-dashed border-[#a07830]/40">
             <div className="flex items-center gap-3 mb-8">
                <Users className="w-6 h-6 text-[#2a1a0a]" />
                <h2 className="text-2xl font-black text-[#2a1a0a] uppercase font-serif">Investigation Squad</h2>
             </div>

             <div className="space-y-6">
                <AnimatePresence>
                   {detectives.map((det, i) => (
                      <motion.div 
                        key={det} 
                        initial={{ x: -20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 bg-[#f0e0a0]/50 p-4 border-2 border-black/5"
                      >
                         <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[#a07830]" />
                         </div>
                         <div>
                            <div className="text-[10px] text-[#a07830] font-black uppercase tracking-widest leading-none">Status: Active</div>
                            <div className="text-xl font-black text-[#2a1a0a] uppercase leading-tight">{det}</div>
                         </div>
                         {i === 0 && <span className="ml-auto px-2 py-0.5 bg-[#8B2020] text-[#f0e0a0] text-[8px] font-black uppercase tracking-widest">Host</span>}
                      </motion.div>
                   ))}
                </AnimatePresence>
             </div>

             <div className="mt-12 p-6 bg-[#2a1a0a]/5 border-2 border-[#a07830]/20 italic text-[#a07830] font-serif text-sm">
                {gameState.state === 'LOBBY' 
                  ? '"Every detective brings a piece of the puzzle. Wait for the signal to deploy to the field."'
                  : '"The field has been engaged. Operational phase is active."'}
             </div>
          </div>

          <div className="w-full md:w-[350px] bg-[#f0e0a0]/30 p-10 flex flex-col justify-between">
             <div className="space-y-8">
                <div className="space-y-2">
                   <div className="text-[10px] text-[#a07830] font-black uppercase tracking-widest">Operation Phase</div>
                   <div className="flex items-center gap-3 text-[#f0e0a0] p-4 bg-[#2a1a0a] border-2 border-[#a07830] shadow-xl">
                      <Shield className={`w-5 h-5 ${gameState.state === 'LOBBY' ? 'text-[#a07830]' : 'text-green-600 animate-pulse'}`} />
                      <span className="font-mono text-lg font-black tracking-tighter italic">{gameState.state}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="text-[10px] text-[#a07830] font-black uppercase tracking-widest leading-none">Time Remaining</div>
                   <div className={`flex items-center gap-3 p-4 bg-white/50 border border-[#a07830]/40 shadow-inner ${timer < 60 && timer > 0 ? 'text-[#8B2020]' : 'text-[#2a1a0a]'}`}>
                      <Clock className={`w-5 h-5 ${timer < 60 && timer > 0 ? 'animate-pulse' : 'opacity-40'}`} />
                      <span className="font-mono text-3xl font-black">{formatTime(timer)}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="text-[10px] text-[#a07830] font-black uppercase tracking-widest">Field Objectives</div>
                   <div className="p-4 bg-[#2a1a0a]/5 border-2 border-dashed border-[#a07830]/40 space-y-3">
                      <div className="flex gap-2 items-start">
                         <div className="w-1.5 h-1.5 bg-[#8B2020] rounded-full mt-1.5" />
                         <span className="text-[11px] font-bold text-[#2a1a0a] leading-tight">Sync node state with command center</span>
                      </div>
                      <div className="flex gap-2 items-start">
                         <div className="w-1.5 h-1.5 bg-[#8B2020] rounded-full mt-1.5" />
                         <span className="text-[11px] font-bold text-[#2a1a0a] leading-tight">Analyze network for spatial anomalies</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-10 flex flex-col gap-4">
                <button
                   onClick={() => navigate('/lobby')}
                   className="w-full flex items-center justify-center gap-2 py-4 border-2 border-[#a07830] text-[#a07830] font-black uppercase tracking-widest text-xs hover:bg-[#a07830]/10 transition-all"
                >
                   <ChevronLeft className="w-4 h-4" /> Withdraw Team
                </button>
                                {isHost && gameState.state === 'LOBBY' && (
                    <button
                       onClick={handleLaunch}
                       className="w-full group relative flex items-center justify-center gap-3 py-5 bg-[#8B2020] text-[#f0e0a0] font-black uppercase tracking-widest text-sm shadow-[0_10px_20px_rgba(139,32,32,0.4)] transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                       <Play className="w-5 h-5" /> Launch Operation
                    </button>
                 )}

                 {gameState.state !== 'LOBBY' && (
                    <div className="space-y-4">
                       <button
                          onClick={() => navigate(`/mission/mission-02`)}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-[#2a1a0a] text-[#f0e0a0] font-black uppercase tracking-widest text-xs border-2 border-[#a07830] hover:brightness-110"
                       >
                          Engage Analysis Terminal
                       </button>
                       <p className="text-[9px] text-[#a07830] text-center uppercase font-black tracking-widest opacity-60">Phase duration is locking...</p>
                    </div>
                 )}
              </div>
          </div>
       </motion.div>
    </div>
  );
}
