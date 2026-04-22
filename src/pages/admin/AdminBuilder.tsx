import React, { useState, useEffect } from 'react';
import { Plus, Database, FileText, Cpu, Key } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

export default function AdminBuilder() {
 const [masterKey, setMasterKey] = useState<any[]>([]);
 const { playSound } = useSound();
 
 const [newCase, setNewCase] = useState({ title: '', description: '', difficulty: 'Easy', correct_attacker: '', points_on_solve: 500 });
 const [newEvidence, setNewEvidence] = useState({ case_id: '', type: 'log', title: '', content: '', metadata: '' });
 const [newPuzzle, setNewPuzzle] = useState({ case_id: '', question: '', answer: '', points: 50, hint: '' });

 const fetchKeys = () => {
 fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
 .then(res => res.json())
 .then(data => { if (Array.isArray(data)) setMasterKey(data); });
 };

 useEffect(() => { fetchKeys(); }, []);

 const handleCreateCase = async (e: React.FormEvent) => {
 e.preventDefault();
 playSound('click');
 const res = await fetch('/api/admin/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(newCase) });
 if (res.ok) { playSound('success'); alert('Case Created'); fetchKeys(); setNewCase({ title: '', description: '', difficulty: 'Easy', correct_attacker: '', points_on_solve: 500 }); }
 };

 const handleCreateEvidence = async (e: React.FormEvent) => {
 e.preventDefault();
 playSound('click');
 let metadata = null;
 if (newEvidence.metadata) {
 try { metadata = JSON.stringify(JSON.parse(newEvidence.metadata)); } catch { return alert('Invalid JSON in metadata'); }
 }
 const res = await fetch('/api/admin/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ ...newEvidence, metadata }) });
 if (res.ok) { playSound('success'); alert('Evidence Uploaded'); fetchKeys(); }
 };

 const handleCreatePuzzle = async (e: React.FormEvent) => {
 e.preventDefault();
 playSound('click');
 const res = await fetch('/api/admin/puzzles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(newPuzzle) });
 if (res.ok) { playSound('success'); alert('Puzzle Created'); fetchKeys(); }
 };

 return (
 <div className="space-y-12">
 <div>
 <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Mission Architect</h1>
 <p className="text-gray-500 font-mono text-xs mt-1">Design and deploy new investigations directly to the target environment.</p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Case Builder */}
 <div className="bg-black/80 border border-purple-500/30 p-6 space-y-6">
 <div className="flex items-center gap-3 border-b border-[rgba(139,105,20,0.4)] pb-3">
 <Database className="w-5 h-5 text-purple-500" />
 <h2 className="font-display font-bold text-white uppercase">Initialize Target Node (Case)</h2>
 </div>
 <form onSubmit={handleCreateCase} className="space-y-4 font-mono text-xs">
 <input required type="text" placeholder="Title" value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 <textarea required rows={3} placeholder="Mission Briefing..." value={newCase.description} onChange={e => setNewCase({...newCase, description: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 <div className="grid grid-cols-2 gap-4">
 <select value={newCase.difficulty} onChange={e => setNewCase({...newCase, difficulty: e.target.value})} className="bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white">
 <option>Easy</option><option>Intermediate</option><option>Hard</option>
 </select>
 <input required type="number" placeholder="XP Reward" value={newCase.points_on_solve} onChange={e => setNewCase({...newCase, points_on_solve: +e.target.value})} className="bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 </div>
 <input required type="text" placeholder="Root Threat Actor (Answer)" value={newCase.correct_attacker} onChange={e => setNewCase({...newCase, correct_attacker: e.target.value})} className="w-full bg-black border border-purple-500 p-2 text-white" />
 <button type="submit" className="w-full bg-purple-500/20 text-purple-400 font-bold uppercase tracking-widest py-3 border border-purple-500/50 hover:bg-purple-500 hover:text-black transition-colors">Deploy Scenario</button>
 </form>
 </div>

 {/* Evidence Builder */}
 <div className="bg-black/80 border border-[#a07830]/30 p-6 space-y-6">
 <div className="flex items-center gap-3 border-b border-[rgba(139,105,20,0.4)] pb-3">
 <FileText className="w-5 h-5 text-[#a07830]" />
 <h2 className="font-display font-bold text-white uppercase">Inject Telemetry (Evidence)</h2>
 </div>
 <form onSubmit={handleCreateEvidence} className="space-y-4 font-mono text-xs">
 <select required value={newEvidence.case_id} onChange={e => setNewEvidence({...newEvidence, case_id: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white">
 <option value="">Select Parent Incident...</option>
 {masterKey.map(k => <option key={k.id} value={k.id}>{k.title}</option>)}
 </select>
 <div className="grid grid-cols-2 gap-4">
 <select value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value})} className="bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white">
 <option value="log">Server Log</option><option value="chat">Comms Trace</option><option value="html">System Hex</option>
 </select>
 <input required type="text" placeholder="Title" value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 </div>
 <textarea required rows={5} placeholder="Raw Telemetry Data..." value={newEvidence.content} onChange={e => setNewEvidence({...newEvidence, content: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 <button type="submit" className="w-full bg-[#a07830]/20 text-[#a07830] font-bold uppercase tracking-widest py-3 border border-[#a07830]/50 hover:bg-[#a07830] hover:text-black transition-colors">Inject Data</button>
 </form>
 </div>

 {/* Puzzle Builder */}
 <div className="bg-black/80 border border-[#c8a050]/30 p-6 space-y-6 lg:col-span-2 text-xs font-mono">
 <div className="flex items-center gap-3 border-b border-[rgba(139,105,20,0.4)] pb-3">
 <Cpu className="w-5 h-5 text-[#c8a050]" />
 <h2 className="font-display font-bold text-white uppercase text-base">Cipher Nodes (Puzzles)</h2>
 </div>
 <form onSubmit={handleCreatePuzzle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-4">
 <select required value={newPuzzle.case_id} onChange={e => setNewPuzzle({...newPuzzle, case_id: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white">
 <option value="">Select Parent Incident...</option>
 {masterKey.map(k => <option key={k.id} value={k.id}>{k.title}</option>)}
 </select>
 <input required type="text" placeholder="Question / Objective" value={newPuzzle.question} onChange={e => setNewPuzzle({...newPuzzle, question: e.target.value})} className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 </div>
 <div className="space-y-4">
 <input required type="text" placeholder="Access Code (Answer)" value={newPuzzle.answer} onChange={e => setNewPuzzle({...newPuzzle, answer: e.target.value})} className="w-full bg-black border border-[#c8a050] p-2 text-white" />
 <div className="grid grid-cols-2 gap-4">
 <input required type="text" placeholder="Hint" value={newPuzzle.hint} onChange={e => setNewPuzzle({...newPuzzle, hint: e.target.value})} className="bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 <input required type="number" placeholder="XP" value={newPuzzle.points} onChange={e => setNewPuzzle({...newPuzzle, points: +e.target.value})} className="bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white tabular-nums" />
 </div>
 </div>
 <div className="col-span-full">
 <button type="submit" className="w-full bg-[#c8a050]/20 text-[#c8a050] font-bold uppercase tracking-widest py-3 border border-[#c8a050]/50 hover:bg-[#c8a050] hover:text-black transition-colors">Plant Cipher</button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
