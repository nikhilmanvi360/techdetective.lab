import React, { useState, useEffect } from 'react';
import { Settings, Crosshair, TrendingUp, ShieldAlert, Zap, Cpu, Activity, Clock, Sliders, Play, Terminal } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { motion } from 'motion/react';

export default function AdminSystem() {
  const [adversaryConfig, setAdversaryConfig] = useState<any>(null);
  const [multipliers, setMultipliers] = useState<any[]>([]);
  const { playSound } = useSound();

  useEffect(() => {
    const fetchSys = async () => {
      const headers = { 'Authorization': `Bearer ${''}` };
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
      body: JSON.stringify({ multiplier, durationMinutes, eventTypes: ['puzzle_solve', 'case_solve'] })
    });
    if (res.ok) {
      playSound('success');
      const text = await fetch('/api/admin/multipliers', { headers: { 'Authorization': `Bearer ${''}` } }).then(r => r.json());
      setMultipliers(text);
      (e.target as HTMLFormElement).reset();
    }
  };

  if (!adversaryConfig && multipliers.length === 0) return <div className="text-[#d4a017] font-mono animate-pulse uppercase tracking-[0.4em]">Initializing Core Systems...</div>;

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// SYSTEM_ARCHITECTURE_OVERRIDE</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Core <span className="text-[#d4a017]">Engine</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Adversary Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 px-6 py-4 bg-[#0c0803] border-2 border-[#3a2810] rounded-sm">
            <Cpu className="w-5 h-5 text-red-600 animate-pulse" />
            <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Adversary AI Architecture</h2>
            <div className="ml-auto">
               <div className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${adversaryConfig?.enabled ? 'bg-red-900/20 text-red-500 border-red-900/40 shadow-[0_0_8px_rgba(153,27,27,0.3)]' : 'bg-black text-gray-700 border-gray-900'}`}>
                 {adversaryConfig?.enabled ? '● FULLY_AUTONOMOUS' : '○ MANUAL_CONTROL'}
               </div>
            </div>
          </div>
          
          <div className="bg-[#140e06] border-2 border-[#3a2810] p-10 space-y-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 text-red-900 opacity-5 pointer-events-none transform -rotate-12">
               <Crosshair className="w-32 h-32" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Protocol Execution</div>
                  <div className="text-sm font-black text-[#f4e6c4] uppercase tracking-tight">Autonomous Adversary Logic</div>
                </div>
                <button 
                  onClick={() => handleUpdateAdversary({ enabled: !adversaryConfig?.enabled })}
                  className={`px-8 py-3 font-black uppercase text-[10px] tracking-widest border-2 transition-all hover:scale-105 active:scale-95 ${adversaryConfig?.enabled ? 'bg-red-900/10 border-red-900 text-red-500' : 'bg-black border-[#3a2810] text-[#a07830]'}`}
                >
                  {adversaryConfig?.enabled ? 'KILL_SWITCH' : 'INITIATE'}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-[#a07830] uppercase tracking-widest flex items-center gap-2">
                     <Sliders className="w-3 h-3" /> Aggression Calibration
                   </label>
                   <span className="text-xs font-mono font-black text-[#d4a017]">{Math.round((adversaryConfig?.aggressionLevel || 0) * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.1" 
                  value={adversaryConfig?.aggressionLevel || 0.5}
                  onChange={e => handleUpdateAdversary({ aggressionLevel: parseFloat(e.target.value) })}
                  className="w-full accent-[#d4a017] bg-[#3a2810] h-1.5 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-10 border-t-2 border-[#3a2810]">
              <div className="text-[10px] font-black text-[#8B2020] uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                 <ShieldAlert className="w-3 h-3" /> Manual Intrusion Payload
              </div>
              <form className="space-y-5 font-mono" onSubmit={async e => {
                e.preventDefault();
                playSound('click');
                const fd = new FormData(e.currentTarget);
                await fetch('/api/admin/adversary/trigger', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${''}` },
                  body: JSON.stringify({ actionType: fd.get('actionType'), message: fd.get('message') })
                });
                playSound('success');
                (e.target as HTMLFormElement).reset();
              }}>
                <select id="action-type" name="actionType" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs tracking-widest focus:border-[#d4a017]/40 outline-none">
                  <option value="glitch">Deploy UI Glitch</option>
                  <option value="fake_evidence">Fabricate Evidence Stream</option>
                  <option value="taunt">Broadcast Adversary Message</option>
                </select>
                <input id="payload-message" required name="message" type="text" placeholder="TRANSMISSION CONTENT..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black uppercase text-xs tracking-widest focus:border-[#d4a017]/40 outline-none placeholder:text-[#a07830]/20" />
                <button className="w-full bg-[#2a1a0a] text-red-700 font-black py-4 border-2 border-red-900/30 hover:bg-red-900 hover:text-black transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2">
                  <Play className="w-3 h-3" /> Execute Payload
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Multiplier Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 px-6 py-4 bg-[#0c0803] border-2 border-[#3a2810] rounded-sm">
            <Zap className="w-5 h-5 text-[#d4a017]" />
            <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Economic Modifiers</h2>
          </div>
          
          <div className="bg-[#140e06] border-2 border-[#3a2810] p-10 space-y-10 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-8 text-[#d4a017] opacity-5 pointer-events-none transform rotate-45 scale-125">
                <TrendingUp className="w-32 h-32" />
             </div>

             <div className="space-y-6">
               <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#d4a017]" /> Reward Scaling
               </div>
               <form onSubmit={handleSaveMul} className="space-y-6 font-mono">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Multiplier (X)</label>
                     <input id="multiplier-scale" required name="multiplier" type="number" step="0.1" placeholder="E.G. 1.5" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-[#a07830] uppercase tracking-widest">Duration (MINS)</label>
                     <input id="duration-minutes" required name="durationMinutes" type="number" placeholder="E.G. 30" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
                   </div>
                 </div>
                 <button className="w-full bg-[#d4a017] text-black font-black py-4 border-2 border-[#f0d070] hover:bg-[#f0d070] transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2">
                   <TrendingUp className="w-3 h-3" /> Activate Global XP Boost
                 </button>
               </form>
             </div>

             <div className="pt-10 border-t-2 border-[#3a2810] space-y-4">
               <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Active Temporal Modifiers
               </div>
               
               <div className="space-y-3">
                 {multipliers.filter(m => new Date(m.expires_at) > new Date()).length === 0 ? (
                   <div className="p-8 border-2 border-dashed border-[#3a2810] text-center opacity-30">
                      <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest italic">No active multipliers</div>
                   </div>
                 ) : multipliers.filter(m => new Date(m.expires_at) > new Date()).map((m, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 border-2 border-[#d4a017]/30 bg-[#d4a017]/5 flex justify-between items-center text-xs font-mono shadow-lg relative overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-[#d4a017]/10 to-transparent" />
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="p-2 bg-[#d4a017] text-black rounded-sm">
                           <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div className="space-y-0.5">
                           <div className="text-lg font-black text-[#f0d070] leading-none">{m.multiplier}X BOOST</div>
                           <div className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Global Field Incentive</div>
                        </div>
                     </div>
                     <div className="text-right relative z-10">
                        <div className="text-[9px] font-black text-[#a07830] uppercase tracking-widest mb-1">Time Remaining</div>
                        <div className="text-[#f4e6c4] font-black tabular-nums tracking-widest">{new Date(m.expires_at).toLocaleTimeString([], { hour12: false })}</div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0c0803] p-4 border-2 border-[#3a2810] flex items-center justify-between text-[8px] font-black text-[#a07830]/40 uppercase tracking-[0.4em] font-mono">
         <span>System Protocol: Hardened</span>
         <span>CCU-Nexus-Core: 0x9AF2</span>
      </div>
    </div>
  );
}
