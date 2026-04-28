import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, AlertTriangle, CheckCircle2, Terminal as TerminalIcon } from 'lucide-react';
import { io } from 'socket.io-client';

export default function NeuralLinkTerminal() {
  const [currentKey, setCurrentKey] = useState<string[]>(Array(32).fill('_'));
  const [assignment, setAssignment] = useState<any>(null);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastContributor, setLastContributor] = useState<number | null>(null);

  useEffect(() => {
    const socket = io();
    fetchInitialState();

    socket.on('r3_neural_update', (data) => {
      setCurrentKey(data.currentKey);
      setLastContributor(data.teamId);
      setTimeout(() => setLastContributor(null), 2000);
    });

    socket.on('r3_neural_reset', (data) => {
      setCurrentKey(Array(32).fill('_'));
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchInitialState = async () => {
    const token = localStorage.getItem('token');
    
    // Get assignment
    const fragRes = await fetch('/api/r3/neural/fragment', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const fragData = await fragRes.json();
    setAssignment(fragData);

    // Get current state
    const stateRes = await fetch('/api/r3/neural/state', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const stateData = await stateRes.json();
    setCurrentKey(stateData.currentKey);
  };

  const handleSubmit = async () => {
    if (userInput.length !== 2) return;
    
    const res = await fetch('/api/r3/neural/submit', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ segment: userInput })
    });

    if (res.ok) {
        setUserInput('');
        setError(null);
    } else {
        const data = await res.json();
        setError(data.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-12 bg-[#0c0803] border-4 border-[#3a2810] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4a017 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative z-10 space-y-12">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#3a2810] pb-8">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#d4a017] text-black rounded-sm shadow-[0_0_20px_rgba(212,160,23,0.4)]">
                      <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-[#f4e6c4]">The Neural Link</h2>
                      <p className="text-[10px] text-[#a07830] uppercase tracking-[0.4em] mt-1">Status: Collaborative Brute-Force Protocol // Phase 3.3</p>
                  </div>
              </div>
              {assignment && (
                  <div className="px-6 py-3 bg-[#3a2810]/30 border border-[#d4a017]/20 rounded-sm">
                      <span className="text-[10px] font-black text-[#a07830] uppercase tracking-widest block mb-1 text-center">Your Segment</span>
                      <div className="text-3xl font-black text-[#d4a017] tracking-[0.5em] text-center font-mono">
                          {assignment.segment}
                      </div>
                      <span className="text-[8px] text-[#a07830]/60 uppercase block mt-1 text-center italic">Slots {assignment.index + 1}-{assignment.index + 2}</span>
                  </div>
              )}
          </div>

          {/* The Master Key Grid */}
          <div className="grid grid-cols-8 md:grid-cols-16 gap-3">
              {currentKey.map((char, i) => (
                  <motion.div 
                    key={i}
                    initial={false}
                    animate={{ 
                        scale: char !== '_' ? [1, 1.1, 1] : 1,
                        backgroundColor: char !== '_' ? '#d4a017' : '#140e06',
                        color: char !== '_' ? '#000' : '#3a2810'
                    }}
                    className={`aspect-square flex items-center justify-center text-2xl font-black font-mono border-2 transition-all ${char !== '_' ? 'border-[#f0d070]' : 'border-[#3a2810]'}`}
                  >
                      {char}
                  </motion.div>
              ))}
          </div>

          {/* Interaction Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-6">
                  <div className="flex items-center gap-3 text-red-500">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Protocol Warning</span>
                  </div>
                  <p className="text-sm text-[#a07830] leading-relaxed italic">
                      "Collective synchronization required. Any data collision will trigger a total system reset. Communicate with other investigative units before injection."
                  </p>

                  <div className="bg-black/40 border border-[#3a2810] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Local Buffer</span>
                          <span className="text-[8px] text-[#a07830]/40 font-mono italic">CHAR_LIMIT: 02</span>
                      </div>
                      <div className="flex gap-4">
                          <input 
                            type="text" 
                            maxLength={2}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                            className="flex-1 bg-black border-2 border-[#3a2810] p-4 text-3xl font-black font-mono text-[#d4a017] focus:border-[#d4a017] outline-none transition-all placeholder:text-[#3a2810]"
                            placeholder="XX"
                          />
                          <button 
                            onClick={handleSubmit}
                            disabled={userInput.length !== 2}
                            className="px-8 bg-[#d4a017] text-black font-black uppercase tracking-widest text-[11px] hover:bg-[#f0d070] disabled:opacity-20 transition-all shadow-xl flex items-center gap-2"
                          >
                              Inject <Zap className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </div>

              <div className="bg-[#140e06] border-2 border-[#3a2810] p-8 flex flex-col items-center justify-center text-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#3a2810]" />
                  <TerminalIcon className="w-12 h-12 text-[#a07830] mb-4 opacity-40" />
                  
                  <AnimatePresence mode="wait">
                      {error ? (
                          <motion.div 
                            key="error"
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                            className="text-red-500 space-y-2"
                          >
                              <div className="text-xs font-black uppercase tracking-widest">System Reset</div>
                              <p className="text-[10px] font-mono italic">{error}</p>
                          </motion.div>
                      ) : lastContributor ? (
                          <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="text-green-500 space-y-2"
                          >
                              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                              <div className="text-xs font-black uppercase tracking-widest">Fragment Synchronized</div>
                              <p className="text-[10px] font-mono italic opacity-60">Unit {lastContributor} successfully injected data.</p>
                          </motion.div>
                      ) : (
                          <div className="text-[#a07830]/40 text-[10px] font-black uppercase tracking-widest">
                              Waiting for Neural Input...
                          </div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
      </div>
    </div>
  );
}
