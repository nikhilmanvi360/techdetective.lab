import React, { useState, useEffect } from 'react';
import { Settings, Crosshair, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

export default function AdminSystem() {
 const [adversaryConfig, setAdversaryConfig] = useState<any>(null);
 const [multipliers, setMultipliers] = useState<any[]>([]);
 const { playSound } = useSound();

 useEffect(() => {
 const fetchSys = async () => {
 const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
 const [adv, mul] = await Promise.all([
 fetch('/api/admin/adversary', { headers }).then(r => r.json()).catch(() => null),
 fetch('/api/admin/multipliers', { headers }).then(r => r.json()).catch(() => [])
 ]);
 setAdversaryConfig(adv);
 setMultipliers(Array.isArray(mul) ? mul : []);
 };
 fetchSys();
 }, []);

 const handleUpdateAdversary = async (updates: any) => {
 playSound('click');
 const res = await fetch('/api/admin/adversary', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ ...adversaryConfig, ...updates })
 });
 if (res.ok) setAdversaryConfig({ ...adversaryConfig, ...updates });
 };

 const handleSaveMul = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 playSound('click');
 const fd = new FormData(e.currentTarget);
 const multiplier = parseFloat(fd.get('multiplier') as string);
 const durationMinutes = parseInt(fd.get('durationMinutes') as string);
 const res = await fetch('/api/admin/multipliers', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ multiplier, durationMinutes, eventTypes: ['puzzle_solve', 'case_solve'] })
 });
 if (res.ok) {
 playSound('success');
 const text = await fetch('/api/admin/multipliers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
 setMultipliers(text);
 }
 };

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 <div className="space-y-6">
 <div className="flex items-center gap-3 border-b border-[rgba(139,105,20,0.4)] pb-3">
 <Crosshair className="w-5 h-5 text-[#A52A2A]" />
 <h2 className="font-display font-bold text-white uppercase text-xl">Adversary AI Override</h2>
 </div>
 
 {adversaryConfig && (
 <div className="bg-black/60 border border-[#8B1A1A]/30 p-6 space-y-6">
 <div className="flex items-center justify-between">
 <span className="font-mono text-sm text-gray-400">Autonomous Operation</span>
 <button 
 onClick={() => handleUpdateAdversary({ enabled: !adversaryConfig.enabled })}
 className={`px-4 py-1 font-display font-bold uppercase text-xs border ${adversaryConfig.enabled ? 'border-[#d4a017] text-[#d4a017]' : 'border-[#8B1A1A] text-[#A52A2A]'}`}
 >
 {adversaryConfig.enabled ? 'ONLINE' : 'OFFLINE'}
 </button>
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-mono text-gray-500 uppercase">Aggression Level (0.1 - 1.0)</label>
 <input 
 type="range" min="0.1" max="1" step="0.1" 
 value={adversaryConfig.aggressionLevel || 0.5}
 onChange={e => handleUpdateAdversary({ aggressionLevel: parseFloat(e.target.value) })}
 className="w-full accent-cyber-red"
 />
 </div>
 </div>
 )}

 <div className="bg-black/60 border border-[#8B1A1A]/30 p-6 space-y-4">
 <h3 className="text-xs font-display font-bold text-[#A52A2A] uppercase border-b border-[#8B1A1A]/20 pb-2">Manual Hack Deploy</h3>
 <form className="space-y-4 font-mono text-xs" onSubmit={async e => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 await fetch('/api/admin/adversary/trigger', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ actionType: fd.get('actionType'), message: fd.get('message') })
 });
 playSound('success');
 (e.target as HTMLFormElement).reset();
 }}>
   <select id="action-type" name="actionType" className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white">
 <option value="glitch">System Glitch (UI Effect)</option>
 <option value="fake_evidence">Fabricate Logs</option>
 <option value="taunt">Send Taunt</option>
 </select>
   <input id="payload-message" required name="message" type="text" placeholder="Payload message..." className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 <button className="w-full bg-[#8B1A1A]/20 text-[#A52A2A] font-bold py-2 border border-[#8B1A1A] hover:bg-[#8B1A1A] hover:text-black transition-colors">EXECUTE PAYLOAD</button>
 </form>
 </div>
 </div>

 <div className="space-y-6">
 <div className="flex items-center gap-3 border-b border-[rgba(139,105,20,0.4)] pb-3">
 <TrendingUp className="w-5 h-5 text-[#c8a050]" />
 <h2 className="font-display font-bold text-white uppercase text-xl">Global Multipliers</h2>
 </div>
 
 <div className="bg-black/60 border border-[#c8a050]/30 p-6">
 <form onSubmit={handleSaveMul} className="space-y-4 font-mono text-xs">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-gray-500 uppercase">Multiplier Scale</label>
   <input id="multiplier-scale" required name="multiplier" type="number" step="0.1" placeholder="e.g. 1.5" className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 </div>
 <div className="space-y-2">
 <label className="text-gray-500 uppercase">Duration (Mins)</label>
   <input id="duration-minutes" required name="durationMinutes" type="number" placeholder="e.g. 15" className="w-full bg-black border border-[rgba(139,105,20,0.4)] p-2 text-white" />
 </div>
 </div>
 <button className="w-full bg-[#c8a050]/20 text-[#c8a050] font-bold py-2 border border-[#c8a050] hover:bg-[#c8a050] hover:text-black transition-colors">ACTIVATE XP BOOST</button>
 </form>
 </div>

 <div className="space-y-2">
 {multipliers.filter(m => new Date(m.expires_at) > new Date()).map((m, i) => (
 <div key={i} className="p-3 border border-[#c8a050]/30 bg-[#c8a050]/10 flex justify-between items-center text-xs font-mono text-white">
 <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-[#c8a050] fill-cyber-amber"/> {m.multiplier}X ACTIVE</span>
 <span className="text-[#c8a050]">{new Date(m.expires_at).toLocaleTimeString()}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
