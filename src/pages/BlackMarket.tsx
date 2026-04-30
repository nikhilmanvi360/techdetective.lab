import { useState, useEffect } from 'react';
import {
  ShoppingBag, Skull, Zap, Shield,
  Activity, Terminal, Lock, AlertCircle,
  Radio, Archive, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../hooks/useSound';
import { Team } from '../types';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export default function BlackMarket() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);

  const { playSound } = useSound();

  const fetchData = async () => {
    try {
      const token = '';
      const [itemsRes, targetsRes, profileRes] = await Promise.all([
        fetch('/api/shop/items', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/shop/targets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/team/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        if (Array.isArray(data)) setItems(data);
      }
      if (targetsRes.ok) {
        const data = await targetsRes.json();
        if (Array.isArray(data)) setTeams(data);
      }
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setPlayerTeam(profile.team);
      }
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuy = async (itemId: string) => {
    if (itemId === 'emp_jammer' && !selectedTargetId) {
      setFeedback({ success: false, message: 'CRITICAL: Select a target team for EMP deployment.' });
      return;
    }

    setPurchasing(itemId);
    setFeedback(null);
    playSound('click');

    try {
      const token = '';
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId,
          metadata: {
            targetTeamId: itemId === 'emp_jammer' ? selectedTargetId : undefined,
          }
        })
      });

      const result = await res.json();
      setFeedback(result);
      if (result.success) {
        playSound('success');
        fetchData();
      } else {
        playSound('error');
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Link Error: Transaction Interrupted' });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0a0805]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0805] text-[#f0e0a0] relative overflow-hidden">
      {/* Tactical Background Overlays */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a017 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none opacity-60" />
      
      {/* Header */}
      <div className="relative z-10 px-10 py-12 border-b border-[#d4a017]/20 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-full shadow-[0_0_30px_rgba(212,160,23,0.2)]">
            <Skull className="w-10 h-10 text-[#d4a017]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
               <h1 className="text-4xl font-black uppercase tracking-tighter text-[#f0d070]">The <span className="text-[#8B2020]">Black</span> Market</h1>
            </div>
            <p className="text-[10px] font-mono text-[#a07830] uppercase tracking-[0.4em] opacity-60 font-black">Encrypted Bureau Bypass // Illegal Trade Node</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[9px] font-black text-[#a07830] uppercase tracking-widest mb-1">Available Credits</div>
            <div className="text-3xl font-black text-[#d4a017] tracking-tighter tabular-nums flex items-center gap-2">
               <Zap className="w-6 h-6 fill-[#d4a017]" />
               {playerTeam?.score || 0} <span className="text-sm text-[#a07830]/50 ml-1">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {/* Shop Items Section */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4 border-l-4 border-[#d4a017] pl-4 mb-8">
              <ShoppingBag className="w-5 h-5 text-[#d4a017]" />
              <h2 className="text-xl font-black uppercase tracking-widest text-[#f0e0a0]">Available Exploits</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-[#1a1005] border-2 border-[#d4a017]/20 p-6 shadow-2xl relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a017]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#d4a017]/10 transition-colors" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-[#d4a017]/10 border border-[#d4a017]/20">
                         {item.id === 'emp_jammer' ? <Radio className="w-6 h-6 text-red-500" /> : <Archive className="w-6 h-6 text-[#d4a017]" />}
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black text-[#a07830] uppercase mb-1">Cost</div>
                        <div className="text-xl font-black text-[#d4a017] tracking-tighter">{item.cost} XP</div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#f0e0a0] mb-2">{item.name}</h3>
                    <p className="text-xs font-mono text-[#a07830] leading-relaxed mb-8 flex-1">{item.description}</p>
                    
                    <button
                      onClick={() => handleBuy(item.id)}
                      disabled={purchasing === item.id || (playerTeam?.score || 0) < item.cost}
                      className={`w-full py-3 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl transition-all relative overflow-hidden ${
                        (playerTeam?.score || 0) < item.cost
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                          : 'bg-[#d4a017] text-[#1a0e04] hover:bg-[#f0d070] active:scale-95'
                      }`}
                    >
                      {purchasing === item.id ? 'Processing...' : 'Authorize Purchase'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Targets & Feedback Section */}
          <div className="space-y-10">
            {/* Feedback Panel */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 border-2 shadow-2xl flex flex-col items-center text-center ${feedback.success ? 'bg-green-950/20 border-green-500/50' : 'bg-red-950/20 border-red-500/50'}`}
                >
                  <AlertCircle className={`w-8 h-8 mb-4 ${feedback.success ? 'text-green-500' : 'text-red-500'}`} />
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${feedback.success ? 'text-green-500' : 'text-red-500'}`}>System Notification</div>
                  <p className="text-xs font-mono text-[#f0e0a0] leading-relaxed">{feedback.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Target Selection */}
            <div className="bg-[#1a1005] border-2 border-[#d4a017]/20 p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#d4a017]/10">
                <Skull className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-black uppercase tracking-widest text-[#f0e0a0]">Signal Targets</h2>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {teams.filter(t => t.id !== playerTeam?.id).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { playSound('click'); setSelectedTargetId(t.id); }}
                    className={`w-full p-4 flex items-center justify-between border transition-all ${
                      selectedTargetId === t.id 
                        ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                        : 'bg-black/40 border-white/5 text-[#a07830] hover:border-[#d4a017]/30 hover:text-[#f0e0a0]'
                    }`}
                  >
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-widest mb-1">{t.name}</span>
                      <span className="text-[8px] font-mono opacity-50">Signal Strength: 100%</span>
                    </div>
                    {selectedTargetId === t.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
