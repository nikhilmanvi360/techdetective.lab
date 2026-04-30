import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Send, Users, Clock, AlertTriangle, ShieldCheck, FileSearch, Cpu, Zap, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io();

export default function AdminRound3() {
  const [subPhase, setSubPhase] = useState('CHALLENGE');
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    // Initial State
    fetch('/api/admin/r3/state', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        setSubPhase(data.currentSubPhase);
      });

    socket.on('r3_sub_phase_update', (data) => setSubPhase(data.subPhase));

    return () => {
        socket.off('r3_sub_phase_update');
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

  const fetchSubmissions = async () => {
    const res = await fetch('/api/admin/r3/submissions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setSubmissions(data);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// ROUND_4_COMMAND_OVERRIDE</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            The <span className="text-red-600">Verdict</span> Control
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Phase Control */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0803] border-2 border-[#3a2810] p-8 space-y-8">
             <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest border-b border-[#3a2810] pb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4a017]" /> Timeline Control
             </h2>
             <div className="space-y-4">
               {[
                 { id: 'CHALLENGE', label: '1. Verdict Phase (Active)' },
                 { id: 'DEBRIEF', label: '2. Event Concluded' }
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
          
          <button 
            onClick={() => { if(confirm('Reset all Round 4 state?')) fetch('/api/admin/r3/reset', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }) }}
            className="w-full py-3 border-2 border-red-900/20 text-red-900/60 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/10 hover:text-red-900 transition-all"
          >
            Reset Round State
          </button>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-[#0c0803] border-2 border-[#3a2810] p-10 space-y-10">
              <div className="flex items-center justify-between border-b border-[#3a2810] pb-6">
                 <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-blue-500" /> Incoming Verdicts
                 </h2>
                 <button 
                  onClick={fetchSubmissions}
                  className="px-6 py-2 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-colors flex items-center gap-2"
                 >
                    <RefreshCw className="w-3 h-3" /> Refresh Feed
                 </button>
              </div>

              <div className="overflow-hidden border border-[#3a2810]">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="bg-[#140e06] text-[#a07830] border-b border-[#3a2810]">
                      <th className="p-4 uppercase tracking-widest">Team</th>
                      <th className="p-4 uppercase tracking-widest">Target Culprit</th>
                      <th className="p-4 uppercase tracking-widest">Motive / Evidence</th>
                      <th className="p-4 uppercase tracking-widest">System Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a2810]">
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#a07830]/40 italic uppercase">No verdicts filed yet. Monitoring secure channels...</td>
                      </tr>
                    )}
                    {submissions.map((sub, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-[#d4a017] font-black">{sub.team_name || 'Anonymous Operative'}</td>
                        <td className="p-4 text-[#f4e6c4] font-black uppercase">{sub.culprit || '---'}</td>
                        <td className="p-4 text-[#a07830]">{sub.purpose || '---'}</td>
                        <td className="p-4">
                          {sub.is_neutralized ? (
                            <span className="px-2 py-1 bg-green-900/20 text-green-500 border border-green-900">STABILIZED</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-900/20 text-red-500 border border-red-900">THREAT_ACTIVE</span>
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

