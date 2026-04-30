import React, { useState, useEffect } from 'react';
import { Plus, Database, FileText, Cpu, Key, Shield, Zap, Info } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { motion } from 'motion/react';

export default function AdminBuilder() {
  const [masterKey, setMasterKey] = useState<any[]>([]);
  const { playSound } = useSound();
  
  const [newCase, setNewCase] = useState({ title: '', description: '', difficulty: 'Easy', correct_attacker: '', points_on_solve: 500 });
  const [newEvidence, setNewEvidence] = useState({ case_id: '', type: 'log', title: '', content: '', metadata: '' });
  const [newPuzzle, setNewPuzzle] = useState({ case_id: '', question: '', answer: '', points: 50, hint: '' });

  const fetchKeys = () => {
    fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${''}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setMasterKey(data); });
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    const res = await fetch('/api/admin/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` }, body: JSON.stringify(newCase) });
    if (res.ok) { playSound('success'); alert('Case Created'); fetchKeys(); setNewCase({ title: '', description: '', difficulty: 'Easy', correct_attacker: '', points_on_solve: 500 }); }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    let metadata = null;
    if (newEvidence.metadata) {
      try { metadata = JSON.stringify(JSON.parse(newEvidence.metadata)); } catch { return alert('Invalid JSON in metadata'); }
    }
    const res = await fetch('/api/admin/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` }, body: JSON.stringify({ ...newEvidence, metadata }) });
    if (res.ok) { playSound('success'); alert('Evidence Uploaded'); fetchKeys(); }
  };

  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    const res = await fetch('/api/admin/puzzles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` }, body: JSON.stringify(newPuzzle) });
    if (res.ok) { playSound('success'); alert('Puzzle Created'); fetchKeys(); }
  };

  if (masterKey.length === 0) return <div className="p-12 text-[#d4a017] font-mono animate-pulse uppercase tracking-[0.4em]">Initializing Architect Tools...</div>;

  return (
    <div className="space-y-12 pb-12">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// SCENARIO_CONSTRUCTION_UNIT</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Mission <span className="text-[#d4a017]">Architect</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Case Builder - Professional Noir Panel */}
        <div className="bg-[#140e06] border-2 border-[#3a2810] p-10 space-y-8 relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 p-8 text-[#d4a017] opacity-5 pointer-events-none transform rotate-12 group-hover:scale-110 transition-transform duration-700">
             <Database className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-4 border-b-2 border-[#3a2810] pb-4 relative z-10">
            <Shield className="w-5 h-5 text-[#d4a017]" />
            <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Initialize Target Node</h2>
          </div>

          <form onSubmit={handleCreateCase} className="space-y-6 font-mono relative z-10">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Incident Designation</label>
               <input required type="text" placeholder="CASE TITLE..." value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none placeholder:text-[#a07830]/20" />
            </div>
            
            <div className="space-y-2">
               <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Field Briefing</label>
               <textarea required rows={4} placeholder="SITUATION OVERVIEW..." value={newCase.description} onChange={e => setNewCase({...newCase, description: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none placeholder:text-[#a07830]/20 leading-relaxed" />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Threat Rating</label>
                  <select value={newCase.difficulty} onChange={e => setNewCase({...newCase, difficulty: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none">
                    <option>Easy</option><option>Intermediate</option><option>Hard</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">XP Bounty</label>
                  <input required type="number" placeholder="500" value={newCase.points_on_solve} onChange={e => setNewCase({...newCase, points_on_solve: +e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#d4a017] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-[#d4a017] uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Root Threat Actor (Answer)
               </label>
               <input required type="text" placeholder="SUSPECT_NAME..." value={newCase.correct_attacker} onChange={e => setNewCase({...newCase, correct_attacker: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#d4a017]/40 p-4 text-[#f0d070] font-black uppercase text-xs focus:border-[#d4a017] outline-none" />
            </div>

            <button type="submit" className="w-full bg-[#d4a017] text-black font-black py-4 border-2 border-[#f0d070] hover:bg-[#f0d070] transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2 mt-4">
              <Plus className="w-4 h-4" /> Deploy Investigation
            </button>
          </form>
        </div>

        <div className="space-y-12">
          {/* Evidence Injector */}
          <div className="bg-[#140e06] border-2 border-[#3a2810] p-10 space-y-8 relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-4 border-b-2 border-[#3a2810] pb-4">
              <FileText className="w-5 h-5 text-[#d4a017]" />
              <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Inject Field Telemetry</h2>
            </div>
            
            <form onSubmit={handleCreateEvidence} className="space-y-6 font-mono">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Parent Incident</label>
                 <select required value={newEvidence.case_id} onChange={e => setNewEvidence({...newEvidence, case_id: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none">
                    <option value="">SELECT INVESTIGATION...</option>
                    {masterKey.map(k => <option key={k.id} value={k.id}>{k.title.toUpperCase()}</option>)}
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Protocol Type</label>
                    <select value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none">
                      <option value="log">Server Log</option><option value="chat">Comms Trace</option><option value="html">System Hex</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Designation</label>
                    <input required type="text" placeholder="E.G. LOG_77A" value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Raw Data Payload</label>
                 <textarea required rows={4} placeholder="ENCRYPTED TELEMETRY..." value={newEvidence.content} onChange={e => setNewEvidence({...newEvidence, content: e.target.value})} className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#a07830] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none placeholder:text-[#a07830]/20 italic leading-relaxed" />
              </div>

              <button type="submit" className="w-full bg-[#2a1a0a] text-[#d4a017] font-black py-4 border-2 border-[#3a2810] hover:border-[#d4a017]/50 transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Inject Payload
              </button>
            </form>
          </div>

          {/* Puzzle Constructor */}
          <div className="bg-[#0c0803] border-2 border-[#3a2810] p-10 space-y-8 relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-4 border-b-2 border-[#3a2810] pb-4">
              <Cpu className="w-5 h-5 text-[#d4a017]" />
              <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Cipher Node Construction</h2>
            </div>

            <form onSubmit={handleCreatePuzzle} className="space-y-6 font-mono">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Target Incident</label>
                       <select required value={newPuzzle.case_id} onChange={e => setNewPuzzle({...newPuzzle, case_id: e.target.value})} className="w-full bg-[#140e06] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none">
                          <option value="">SELECT INVESTIGATION...</option>
                          {masterKey.map(k => <option key={k.id} value={k.id}>{k.title.toUpperCase()}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Cryptographic Query</label>
                       <input required type="text" placeholder="PUZZLE QUESTION..." value={newPuzzle.question} onChange={e => setNewPuzzle({...newPuzzle, question: e.target.value})} className="w-full bg-[#140e06] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-[#d4a017] uppercase tracking-widest">Decryption Key (Answer)</label>
                       <input required type="text" placeholder="SECRET_PHRASE..." value={newPuzzle.answer} onChange={e => setNewPuzzle({...newPuzzle, answer: e.target.value})} className="w-full bg-[#140e06] border-2 border-[#d4a017]/40 p-4 text-[#f0d070] font-black uppercase text-xs focus:border-[#d4a017] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Field Hint</label>
                          <input required type="text" placeholder="CLUE..." value={newPuzzle.hint} onChange={e => setNewPuzzle({...newPuzzle, hint: e.target.value})} className="w-full bg-[#140e06] border-2 border-[#3a2810] p-4 text-[#a07830] font-black uppercase text-[10px] focus:border-[#d4a017]/40 outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">XP Allocation</label>
                          <input required type="number" placeholder="50" value={newPuzzle.points} onChange={e => setNewPuzzle({...newPuzzle, points: +e.target.value})} className="w-full bg-[#140e06] border-2 border-[#3a2810] p-4 text-[#d4a017] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
                       </div>
                    </div>
                  </div>
               </div>

               <button type="submit" className="w-full bg-[#2a1a0a] text-[#f0d070] font-black py-4 border-2 border-[#3a2810] hover:bg-[#d4a017] hover:text-black transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2">
                 <Cpu className="w-4 h-4" /> Plant Cipher Node
               </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
