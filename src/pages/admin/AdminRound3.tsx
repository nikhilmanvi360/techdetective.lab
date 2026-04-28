import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Send, Users, Clock, AlertTriangle, ShieldCheck, FileSearch, Cpu, Zap } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io();

export default function AdminRound3() {
  const [subPhase, setSubPhase] = useState('MONOLOGUE');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [neuralKey, setNeuralKey] = useState<string[]>(Array(32).fill('_'));
  const [suspectVotes, setSuspectVotes] = useState<Record<string, number>>({});
  const [monologueForm, setMonologueForm] = useState({
    eventName: 'TECH DETECTIVE 2026',
    round1Action: 'deciphered the encrypted courier log',
    round2Action: 'infiltrated the high-rise mainframe',
    suspectAnswer: 'ELIAS VANCE',
    timestamp: '19:42:05',
    rank: '1ST PLACE',
    points: 1250,
    redHerring: 'VIOLET KANE',
    twistReveal: 'government-sanctioned distraction',
    realQuestion: 'Who authorized the kill-switch?',
    duration: 45,
    aiName: 'ANTIGRAVITY'
  });

  const [revealForm, setRevealForm] = useState({
    winningTeam: 'TEAM ALPHA',
    correctEntity: 'THE NEXUS COUNCIL',
    duration: '42:15',
    aiName: 'ANTIGRAVITY'
  });

  useEffect(() => {
    // Initial State
    fetch('/api/round3/state', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        setSubPhase(data.currentSubPhase);
        setNeuralKey(data.neuralLink?.currentKey || Array(32).fill('_'));
        setSuspectVotes(data.suspectVotes || {});
      });

    socket.on('r3_sub_phase_update', (data) => setSubPhase(data.subPhase));
    socket.on('r3_neural_update', (data) => setNeuralKey(data.currentKey));
    socket.on('r3_neural_reset', () => setNeuralKey(Array(32).fill('_')));
    socket.on('r3_global_vote_update', (data) => setSuspectVotes(data.suspectVotes));

    return () => {
        socket.off('r3_sub_phase_update');
        socket.off('r3_neural_update');
        socket.off('r3_neural_reset');
        socket.off('r3_global_vote_update');
    };
  }, []);

  const handleTransition = async (phase: string) => {
    const res = await fetch('/api/admin/r3/transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ phase })
    });
    if (res.ok) setSubPhase(phase);
  };

  const handleUpdateMonologue = async () => {
    await fetch('/api/admin/r3/monologue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(monologueForm)
    });
  };

  const handleUpdateReveal = async () => {
    // We use the same monologue endpoint for now as it's just state broadcast
    await fetch('/api/admin/r3/monologue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(revealForm)
    });
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// ROUND_3_COMMAND_OVERRIDE</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            The <span className="text-red-600">Verdict</span> Control
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Phases & Monitors */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0803] border-2 border-[#3a2810] p-8 space-y-8">
             <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest border-b border-[#3a2810] pb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4a017]" /> Timeline Control
             </h2>
             <div className="space-y-4">
               {[
                 { id: 'MONOLOGUE', label: '1. Opening Monologue' },
                 { id: 'BRIEFING', label: '2. Mission Briefing' },
                 { id: 'CHALLENGE', label: '3. Challenge Phase (78m)' },
                 { id: 'NEURAL_LINK', label: '4. The Neural Link (Collective)' },
                 { id: 'REVEAL', label: '5. Final Reveal' },
                 { id: 'DEBRIEF', label: '6. Event Debrief' }
               ].map((p) => (
                 <button
                   key={p.id}
                   onClick={() => handleTransition(p.id)}
                   className={`w-full py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest border-2 transition-all flex justify-between items-center ${
                     subPhase === p.id 
                       ? 'bg-red-900/20 border-red-900 text-red-500 shadow-[0_0_15px_rgba(153,27,27,0.2)]' 
                       : 'bg-black border-[#3a2810] text-[#a07830] hover:border-[#d4a017]/30'
                   }`}
                 >
                   {p.label}
                   {subPhase === p.id && <Play className="w-3 h-3 animate-pulse" />}
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-[#140e06] border-2 border-[#3a2810] p-8 space-y-6">
              <h2 className="text-xs font-black text-[#d4a017] uppercase tracking-widest flex items-center gap-2">
                 <Cpu className="w-4 h-4" /> Neural Link Monitor
              </h2>
              <div className="grid grid-cols-8 gap-1">
                  {neuralKey.map((char, i) => (
                      <div key={i} className={`aspect-square flex items-center justify-center text-[8px] font-black border ${char !== '_' ? 'bg-[#d4a017] text-black border-[#f0d070]' : 'bg-black text-[#3a2810] border-[#3a2810]'}`}>
                          {char}
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-[#140e06] border-2 border-[#3a2810] p-8 space-y-6">
              <h2 className="text-xs font-black text-[#f4e6c4] uppercase tracking-widest flex items-center gap-2">
                 <FileSearch className="w-4 h-4 text-blue-500" /> Majority Verdict
              </h2>
              <div className="space-y-3">
                  {Object.entries(suspectVotes).map(([suspect, votes]) => (
                      <div key={suspect} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black text-[#a07830] uppercase">
                              <span>{suspect}</span>
                              <span>{votes} Teams</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${((votes as number) / 10) * 100}%` }} />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        {/* Main Panel: Data Configuration */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-[#0c0803] border-2 border-[#3a2810] p-10 space-y-10">
              <div className="flex items-center justify-between border-b border-[#3a2810] pb-6">
                 <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#d4a017]" /> Monologue Dynamic Data
                 </h2>
                 <button onClick={handleUpdateMonologue} className="px-6 py-2 bg-[#d4a017] text-black font-black uppercase text-[10px] tracking-widest hover:bg-[#f0d070] transition-colors flex items-center gap-2">
                    <Send className="w-3 h-3" /> Sync Broadcast
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-8 font-mono">
                 {Object.entries(monologueForm).map(([key, value]) => (
                   <div key={key} className="space-y-2">
                      <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input 
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => setMonologueForm({...monologueForm, [key]: e.target.value})}
                        className="w-full bg-black border-2 border-[#3a2810] p-3 text-[#f4e6c4] text-xs focus:border-[#d4a017] outline-none" 
                      />
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#0c0803] border-2 border-[#3a2810] p-10 space-y-10">
              <div className="flex items-center justify-between border-b border-[#3a2810] pb-6">
                 <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" /> Final Reveal Data
                 </h2>
                 <button onClick={handleUpdateReveal} className="px-6 py-2 bg-green-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-green-500 transition-colors flex items-center gap-2">
                    <Send className="w-3 h-3" /> Sync reveal
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-8 font-mono">
                 {Object.entries(revealForm).map(([key, value]) => (
                   <div key={key} className="space-y-2">
                      <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input 
                        type="text"
                        value={value}
                        onChange={(e) => setRevealForm({...revealForm, [key]: e.target.value})}
                        className="w-full bg-black border-2 border-[#3a2810] p-3 text-[#f4e6c4] text-xs focus:border-green-500 outline-none" 
                      />
                   </div>
                 ))}
              </div>
           </div>

           {/* Submissions Viewer */}
           <div className="bg-[#0c0803] border-2 border-[#3a2810] p-10 space-y-10">
              <div className="flex items-center justify-between border-b border-[#3a2810] pb-6">
                 <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-blue-500" /> Phase B: Live Deductions
                 </h2>
                 <button 
                  onClick={async () => {
                    const res = await fetch('/api/admin/r3/submissions', {
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await res.json();
                    setSubmissions(data);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-colors"
                 >
                    Refresh Log
                 </button>
              </div>

              <div className="overflow-hidden border border-[#3a2810]">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="bg-[#140e06] text-[#a07830] border-b border-[#3a2810]">
                      <th className="p-4 uppercase tracking-widest">Team</th>
                      <th className="p-4 uppercase tracking-widest">Culprit</th>
                      <th className="p-4 uppercase tracking-widest">Evidence Codes</th>
                      <th className="p-4 uppercase tracking-widest">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a2810]">
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#a07830]/40 italic uppercase">No deductions filed yet.</td>
                      </tr>
                    )}
                    {submissions.map((sub, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-[#d4a017] font-black">{sub.teams?.name || 'Unknown'}</td>
                        <td className="p-4 text-[#f4e6c4]">{sub.phase_b_data?.culprit || '---'}</td>
                        <td className="p-4 text-[#a07830]">{sub.phase_b_data?.evidence || '---'}</td>
                        <td className="p-4">
                          {sub.phase_c_status === 'neutralized' ? (
                            <span className="px-2 py-1 bg-green-900/20 text-green-500 border border-green-900">SECURED</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-900/20 text-red-500 border border-red-900">ACTIVE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
