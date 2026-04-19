import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { Send, Cpu, X, HelpCircle, MessageCircle, AlertTriangle, Zap } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { Team } from '../types';

let puter: any = null;
import('@heyputer/puter.js').then(module => {
  puter = module.default;
}).catch(() => console.log('Puter.js not found. Fallback mode active.'));

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
    setLastMessage(null); // Clear previous
    setTimeout(() => {
      setLastMessage(text);
      setIsOpen(true);
    }, 50);
  }, []);

  // Update sign-in status
  const checkAuth = useCallback(async () => {
    if (puter && puter.auth) {
      const signedIn = await puter.auth.isSignedIn();
      setIsSignedIn(signedIn);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Hybrid Interjection Logic
  useEffect(() => {
    const socket = io();
    
    // 1. Reactive Interjections (Events)
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

    // 2. Proactive Interjections (Random Timer)
    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.7) {
        addMessage(JANE_QUOTES[Math.floor(Math.random() * JANE_QUOTES.length)]);
      }
    }, 180000); // Check every 3 mins

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
        // Double check auth before API call
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
          5. Keep the response to 1-2 sharp, technical sentences (max 30 words).
        `;
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
    setLastMessage(null); // Auto-clear on close per user request
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
            className="pointer-events-auto w-72 bg-black/95 border border-cyber-line p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative"
          >
            <button onClick={closeAdvisor} className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors">
               <X className="w-3 h-3" />
            </button>
            
            <div className="text-[9px] font-display text-cyber-green uppercase tracking-[0.3em] mb-2 border-b border-cyber-line pb-1">
              Consultant // Profile: P. Jane
            </div>
            
            <div className="font-mono text-xs leading-relaxed text-gray-200 mb-4 h-auto min-h-[3em]">
              <span className="text-cyber-green mr-2">{'>'}</span>{lastMessage || "How can I help you, detective? Or are you just here to admire my tea cup?"}
            </div>

            {!isSignedIn && (
              <button
                onClick={handleSignIn}
                className="w-full mb-4 bg-cyber-blue/10 border border-cyber-blue/50 text-cyber-blue text-[10px] font-display uppercase tracking-widest py-2 hover:bg-cyber-blue/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-3 h-3" /> Authenticate_Credentials
              </button>
            )}

            <form onSubmit={handleConsult} className="relative mt-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask Jane..."
                className="w-full bg-black border border-cyber-line rounded-none p-2 pr-10 text-[10px] font-mono text-white focus:outline-none focus:border-cyber-blue transition-all"
              />
              <button 
                type="submit" 
                disabled={isThinking}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cyber-blue hover:text-white disabled:opacity-30"
              >
                {isThinking ? <Cpu className="w-4 h-4 animate-spin text-cyber-green" /> : <Send className="w-3 h-3" />}
              </button>
            </form>
            
            {/* Speech Bubble Tail */}
            <div className="absolute bottom-[-1px] right-8 translate-y-full w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-cyber-line" />
            <div className="absolute bottom-0 right-8 translate-y-full w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-black" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto relative group">
        {/* The Consultant Portrait */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-20 h-20 rounded-full border-2 border-cyber-line overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-[#050505]"
        >
          <img 
            src="/images/jane.png" 
            alt="Patrick Jane" 
            className={`w-full h-full object-cover transition-all duration-700 ${isOpen ? 'brightness-110' : 'brightness-75 saturate-50 hover:saturate-100 hover:brightness-100'}`}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          
          {/* Active indicator */}
          <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border border-black shadow-lg transition-all ${isThinking ? 'bg-cyber-blue animate-pulse' : 'bg-cyber-green'}`} />
        </motion.button>

        {/* Status tooltip */}
        <div className="absolute top-1/2 right-full mr-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 border border-cyber-line px-3 py-1 pointer-events-none">
          <span className="text-[10px] font-display text-cyber-green uppercase tracking-[0.2em]">Consultant Status: Online</span>
        </div>
      </div>
    </div>
  );
}
