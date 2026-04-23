import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion } from 'motion/react';
import { Clock, Terminal, Play, Users, Trophy, ChevronLeft, ShieldAlert, FileText, Lamp } from 'lucide-react';

export default function GameRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [codeContent] = useState('// INITIALIZING LABORATORY ANALYSIS PROTOCOL...\n\nfunction analyze_evidence(intel) {\n  // Scan for anomalous signals\n  print("SCANNING...");\n  return true;\n}');
  const [timer, setTimer] = useState(600);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#140e06] text-[#2a1a0a] flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-linen.png")' }} />
      
      {/* Brass Header HUD */}
      <header className="flex-shrink-0 h-20 bg-[#3a2810] border-b-8 border-[#261a0a] flex items-center justify-between px-8 z-20 shadow-2xl">
        <div className="flex items-center gap-8">
           <button onClick={() => navigate('/dashboard')} className="p-2 border-2 border-[#d4a017] bg-[#140e06] text-[#d4a017] hover:scale-110 transition-all">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <div className="flex flex-col">
              <span className="text-[10px] text-[#d4a017] font-black uppercase tracking-[0.4em] leading-none mb-1">Investigation Zone</span>
              <span className="text-xl font-black uppercase text-[#f0e0a0] font-serif italic tracking-tighter">Case Reference: {code}</span>
           </div>
        </div>

        {/* ANALOGUE TIMER */}
        <div className="flex flex-col items-center bg-[#140e06] px-10 py-2 border-4 border-[#d4a017] shadow-inner relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-[#d4a017]/20" />
           <div className="text-[10px] text-[#d4a017] uppercase font-black tracking-[0.3em] mb-1">Time Remaining</div>
           <div className={`text-3xl font-black font-mono tracking-[0.2em] ${timer < 60 ? 'text-[#8B2020] animate-pulse' : 'text-[#f0e0a0]'}`}>
              {formatTime(timer)}
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right flex flex-col mr-4">
              <span className="text-[10px] text-[#a07830] uppercase font-black tracking-widest">Network Status</span>
              <span className="text-[10px] text-[#d4a017] font-black uppercase">SQUAD_SYNCED</span>
           </div>
           <div className="w-14 h-14 bg-[#140e06] border-4 border-[#d4a017] flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-[#d4a017]" />
           </div>
        </div>
      </header>

      {/* Main Board Workspace */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* LEFT: Physical Dossier */}
        <motion.div initial={{ x: -100 }} animate={{ x: 0 }} className="w-[380px] bg-[#f0e0a0] border-[10px] border-[#3a2810] flex flex-col shadow-2xl relative">
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
           
           <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-[#3a2810]/10">
                 <ShieldAlert className="w-6 h-6 text-[#8B2020]" />
                 <span className="text-xs font-black uppercase tracking-[0.2em]">Objective Dossier #A01</span>
              </div>
              
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 font-serif italic">Subnet Gateway Scan</h2>
              <div className="space-y-6 text-sm text-[#3a2810] leading-relaxed font-serif text-justify px-2">
                 <p>"We've intercepted a shadow frequency originating from the Subnet Gateway. It's masking its service identity."</p>
                 <p>"Use the laboratory analyzer to scan the target router. We need a list of all open ports to determine the adversary's entry point."</p>
                 <div className="relative p-6 border-4 border-[#8B2020]/20 bg-[#8B2020]/5 mt-8 overflow-hidden">
                    <div className="text-[10px] uppercase font-black text-[#8B2020] mb-2 tracking-widest">Expected Report</div>
                    <div className="font-mono text-xs font-black italic">"Open ports: 22,80,666"</div>
                    <div className="absolute top-2 right-2 opacity-10"><FileText className="w-12 h-12" /></div>
                 </div>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-dashed border-[#3a2810]/20">
                 <h3 className="text-[10px] font-black uppercase text-[#a07830] mb-4 tracking-[0.3em]">Telegraph Comms</h3>
                 <div className="space-y-4 font-serif italic text-xs text-[#3a2810]/60">
                    <div>&gt; Detective_Alpha is analyzing the node...</div>
                    <div className="text-[#8B2020]">&gt; Detective_Sigma secured the evidence</div>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* MIDDLE: Analyzer Typewriter (Editor) */}
        <div className="flex-1 flex flex-col bg-[#0c0803] border-[12px] border-[#3a2810] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
           {/* Glass reflection effect */}
           <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 z-30" />
           
           <div className="flex-shrink-0 h-14 bg-[#1a0e04] border-b-4 border-[#3a2810] flex items-center px-6 justify-between z-20">
              <div className="flex items-center gap-3">
                 <Terminal className="w-5 h-5 text-[#d4a017]" />
                 <span className="text-xs font-black uppercase tracking-[0.4em] text-[#d4a017]">Laboratory_Analyzer_v8.js</span>
              </div>
              <button className="bg-[#8B2020] hover:bg-[#a02020] px-8 py-2 border-2 border-[#f0e0a0]/20 text-[#f0e0a0] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-lg active:scale-95 flex items-center gap-3">
                 Dispatch Analysis <Play className="w-4 h-4 fill-white" />
              </button>
           </div>
           
           <div className="flex-1 pt-4 relative bg-[#0c0803]">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                defaultValue={codeContent}
                theme="vs-dark"
                options={{
                   minimap: { enabled: false },
                   fontSize: 16,
                   fontFamily: "'Courier New', monospace",
                   scrollBeyondLastLine: false,
                   automaticLayout: true,
                   padding: { top: 20, left: 20 }
                }}
              />
           </div>

           {/* Console Log Area */}
           <div className="h-[200px] border-t-8 border-[#3a2810] bg-[#140e06] p-6 font-mono text-[11px] overflow-y-auto relative z-20">
              <div className="flex items-center justify-between mb-4 border-b border-[#3a2810]/20 pb-2">
                 <div className="text-[#a07830] uppercase text-[10px] font-black tracking-[0.4em]">Telegraph Log</div>
                 <div className="w-2 h-2 bg-[#d4a017] rounded-full animate-pulse" />
              </div>
              <div className="text-[#d4a017]">&gt; Analysis Engine: ONLINE</div>
              <div className="text-[#f0e0a0]/60">&gt; Target Node identified... [192.168.1.1]</div>
              <div className="text-[#f0e0a0]/60">&gt; Scanning frequency 82.4MHz... Found match.</div>
              <div className="text-[#8B2020]">&gt; WARNING: External interference detected.</div>
           </div>
        </div>

        {/* RIGHT: Ranking Slate */}
        <motion.div initial={{ x: 100 }} animate={{ x: 0 }} className="w-[320px] bg-[#e8d5a0] border-[10px] border-[#3a2810] shadow-2xl relative p-8">
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
           
           <div className="flex items-center gap-3 mb-10 text-[#8B2020]">
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Squad Rankings</span>
           </div>

           <div className="space-y-6">
              {[
                { name: 'Squad_Alpha', points: 450, rank: 1 },
                { name: 'Detective_Zero', points: 320, rank: 2 },
                { name: 'Lone_Wolf', points: 120, rank: 3 },
              ].map((player, i) => (
                 <div key={player.name} className="flex items-center justify-between p-4 bg-white/30 border-2 border-[#3a2810]/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4">
                       <span className="text-sm font-black text-[#3a2810]/30 font-serif italic">#{player.rank}</span>
                       <span className="text-sm font-black uppercase tracking-tight text-[#2a1a0a]">{player.name}</span>
                    </div>
                    <span className="text-xs font-mono font-black text-[#8B2020] bg-white/40 px-2 py-0.5">{player.points} XP</span>
                    {i === 0 && <div className="absolute top-0 right-0 w-8 h-8 bg-[#d4a017] text-[#140e06] flex items-center justify-center rotate-45 translate-x-4 -translate-y-4 shadow-lg"><Lamp className="w-3 h-3 -rotate-45" /></div>}
                 </div>
              ))}
           </div>

           <div className="mt-12 text-center">
              <p className="font-serif italic text-xs text-[#a07830] leading-relaxed">
                 "Precision is the detective's greatest weapon."
              </p>
           </div>
        </motion.div>
      </main>

      {/* Atmospheric Flickering Light Effect */}
      <div className="fixed inset-0 pointer-events-none bg-black/5 animate-pulse" />
    </div>
  );
}
