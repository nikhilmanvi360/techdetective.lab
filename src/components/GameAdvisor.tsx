import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { Send, Cpu, X, Zap, Activity } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { Team } from '../types';

// --- Puter Initialization ---
let puter: any = null;

interface GameAdvisorProps {
  team: Team;
  location: string;
}

const JANE_QUOTES = [
  "I've analyzed the packet headers. You're looking at the payload, but ignoring the source routing. Traditional mistake.",
  "The encryption isn't the problem. It's the logic gate in the authentication script. Look closer.",
  "I find your lack of forensic methodology... amusing. Start with the metadata.",
  "Digital footprints are just like physical ones—everyone leaves a trace. Check the symlinks.",
  "You're chasing red herrings. The exploit isn't in the code, it's in the configuration. Think like a sysadmin.",
  "Forensics isn't just about what's there. It's about what was deleted. Check the inode shadows.",
];

export default function GameAdvisor({ team, location }: GameAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { playSound } = useSound();
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const addMessage = useCallback((text: string) => {
    setLastMessage(null);
    setTimeout(() => {
      setLastMessage(text);
      setIsOpen(true);
    }, 50);
  }, []);

  const checkAuth = useCallback(async () => {
    if (puter && puter.auth) {
      const signedIn = await puter.auth.isSignedIn();
      setIsSignedIn(signedIn);
    }
  }, []);

  useEffect(() => {
    if (!puter) {
      import('@heyputer/puter.js').then(module => {
        puter = module.default;
        checkAuth();
      }).catch(() => console.log('Puter.js not found.'));
    }
  }, [checkAuth]);

  useEffect(() => {
    const socket = io();
    
    socket.on('live_event', (event: any) => {
      if (event.type === 'solve' && Math.random() > 0.5) {
        addMessage(`I see you handled "${event.message.split(': ')[1]}". Quite straightforward, wasn't it?`);
      }
    });

    socket.on('adversary_action', (event: any) => {
      if (event.target_team_id === team.id) {
        addMessage("Someone's trying to get inside your head. Slower than I expected from an 'Adversary'.");
      }
    });

    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.7) {
        addMessage(JANE_QUOTES[Math.floor(Math.random() * JANE_QUOTES.length)]);
      }
    }, 180000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [addMessage, team.id, isOpen]);

  const handleSignIn = async () => {
    if (puter && puter.auth) {
      try {
        await puter.auth.signIn();
        await checkAuth();
        addMessage("Handshake complete. My higher-order processors are now active.");
      } catch (err) {
        addMessage("Authentication failed. Don't worry, I can still observe from the sidelines.");
      }
    }
  };

  const handleConsult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isThinking) return;

    playSound('click');
    setIsThinking(true);
    const question = userInput;
    setUserInput('');

    try {
      if (puter && puter.ai) {
        const signedIn = await puter.auth.isSignedIn();
        if (!signedIn) {
          addMessage("Security clearance denied. I need you to authenticate your credentials (sign in to Puter) before we talk shop.");
          setIsThinking(false);
          return;
        }

        const prompt = `
        Role: You are Patrick Jane, a high-level forensic cyber-consultant. 
        Personality: Witty, sarcastic, deeply technical, and slightly condescending but helpful.
        Current Game Context: 
        - Team: ${team.name}
        - Score: ${team.score}
        - Current Sector: ${location}
        
        User Query: "${question}"
        
        CRITICAL INSTRUCTIONS:
        1. NEVER provide direct answers or solutions to puzzles/cases.
        2. Focus on GUIDING the player by explaining complex technical terms or jargon found in their query.
        3. Use a professional, forensic, and highly technical tone.
        4. Maintain your trademark wit and sarcasm—make them work for the answer.
        5. Keep the response to 1-2 sharp, technical sentences (max 30 words). `;
        const response = await puter.ai.chat(prompt);
        addMessage(response.toString());
      } else {
        addMessage(JANE_QUOTES[Math.floor(Math.random() * JANE_QUOTES.length)]);
      }
    } catch (err: any) {
      if (err.status === 401) {
        addMessage("Handshake failure. Click below to re-authenticate with my neural net.");
      } else {
        addMessage(JANE_QUOTES[Math.floor(Math.random() * JANE_QUOTES.length)]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const closeAdvisor = () => {
    setIsOpen(false);
    setLastMessage(null);
    setUserInput('');
  };

  return (
    <div className="fixed bottom-24 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="pointer-events-auto w-72 bg-[#e8d8a0]/95 backdrop-blur-md border-2 border-[#a07830] shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative"
          >
            {/* Bureau Header */}
            <div className="bg-black/10 px-4 py-2 border-b border-[#a07830]/30 flex items-center justify-between">
              <span className="text-[9px] font-black text-[#1a0e04]/60 uppercase tracking-[0.2em]">
                Consultant // P. Jane
              </span>
              <button 
                onClick={closeAdvisor} 
                className="text-[#1a0e04]/40 hover:text-red-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="font-mono text-[10px] leading-relaxed text-[#1a0e04] h-auto min-h-[3em] pr-2">
                <span className="text-[#a07830] mr-2 font-black">▶</span>
                {lastMessage || "How can I help you, detective?"}
              </div>

              {!isSignedIn && (
                <button
                  onClick={handleSignIn}
                  className="w-full bg-[#1a0e04]/10 border border-[#a07830]/40 text-[#1a0e04] text-[9px] font-black uppercase tracking-widest py-2 hover:bg-[#d4a017]/10 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3 h-3 text-[#a07830]" /> 
                  Link Neural Net
                </button>
              )}

              <form onSubmit={handleConsult} className="relative pt-2 border-t border-[#a07830]/10">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="CONSULT..."
                  className="w-full bg-black/5 border border-[#a07830]/30 p-2 pr-8 text-[9px] font-black uppercase tracking-widest text-[#1a0e04] placeholder-[#1a0e04]/30 focus:outline-none focus:border-[#a07830] transition-all"
                />
                <button 
                  type="submit" 
                  disabled={isThinking}
                  className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 text-[#a07830] hover:text-[#1a0e04] disabled:opacity-30"
                >
                  {isThinking ? <Cpu className="w-3.5 h-3.5 animate-spin text-[#d4a017]" /> : <Send className="w-3 h-3" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto relative group">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          animate={isOpen ? { y: 0 } : { y: [0, -8, 0] }}
          transition={{ 
            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.1, y: 0 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-16 h-16 rounded-full border-[3px] border-[#a07830] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.6)] bg-[#140e06]"
        >
          <img 
            src="/images/jane.png" 
            alt="Patrick Jane" 
            className={`w-full h-full object-cover transition-all duration-700 ${isOpen ? 'brightness-110' : 'brightness-75 saturate-50 hover:saturate-100 hover:brightness-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,10,0,0.4)] to-transparent pointer-events-none" />
          <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-[#140e06] shadow-[0_0_10px_rgba(212,160,23,0.8)] transition-all ${isThinking ? 'bg-[#f0a030] animate-pulse' : 'bg-[#d4a017]'}`} />
        </motion.button>
        
        <div className="absolute top-1/2 right-full mr-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#1a0e04] border-2 border-[#a07830] px-4 py-1.5 pointer-events-none shadow-2xl">
          <span className="text-[10px] font-black text-[#f0d070] uppercase tracking-[0.25em]">Consultant Status: Online</span>
        </div>
      </div>
    </div>
  );
}
