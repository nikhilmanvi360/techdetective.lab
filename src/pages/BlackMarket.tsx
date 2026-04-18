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
      const token = localStorage.getItem('token');
      const [itemsRes, targetsRes, profileRes] = await Promise.all([
        fetch('/api/shop/items', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/shop/targets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/team/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (targetsRes.ok) setTeams(await targetsRes.json());
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
      const token = localStorage.getItem('token');
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
            // Normally we'd pass case_id for evidence/hint if we had multiple active
          }
        })
      });

      const result = await res.json();
      setFeedback(result);
      if (result.success) {
        playSound('success');
        fetchData(); // Refresh score
      } else {
        playSound('error');
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Link Error: Transaction Interrupted' });
      playSound('error');
    } finally {
      setPurchasing(null);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileSearch': return <Terminal className="w-5 h-5" />;
      case 'Unlock': return <Lock className="w-5 h-5" />;
      case 'Radio': return <Radio className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Skull className="w-12 h-12 text-cyber-red animate-pulse" />
        <div className="font-display text-cyber-red uppercase tracking-[0.4em] flicker-anim">
          Establishing_Dark_Link...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      {/* Header Panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cyber-panel border-cyber-red/30 p-8 relative overflow-hidden bg-gradient-to-br from-black via-black to-cyber-red/5"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Skull className="w-32 h-32 text-cyber-red" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-cyber-red mb-1">
              <span className="text-[10px] font-display uppercase tracking-[0.5em] font-bold py-1 px-3 bg-cyber-red/10 border border-cyber-red/30">Restricted_Access</span>
              <span className="text-[10px] font-mono text-gray-600">Encrypted_Vortex_Market_v0.9</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-white tracking-widest glitch-text">
              BLACK<span className="text-cyber-red">_MARKET</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm max-w-xl">
              Spend accumulated XP units to bypass security protocols or disrupt rival operations. 
              Transactions are non-refundable and permanently logged.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 bg-black/60 border border-cyber-red/20 p-6 corner-brackets relative min-w-[200px]">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-cyber-amber animate-pulse" />
              <span className="text-[10px] font-display text-gray-500 uppercase tracking-widest">Available_Credits</span>
            </div>
            <span className="text-3xl font-display font-bold text-cyber-amber tracking-tighter tabular-nums">
              {playerTeam?.score?.toLocaleString() || 0} <span className="text-xs text-cyber-amber/50 font-normal">XP</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Item Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`group relative flex flex-col h-full bg-black/40 border border-cyber-line p-6 hover:border-cyber-red/40 transition-all ${
              playerTeam && playerTeam.score < item.cost ? 'opacity-50 grayscale pointer-events-none' : ''
            }`}
          >
            <div className="absolute top-0 right-0 p-3 text-gray-800 pointer-events-none group-hover:text-cyber-red/10 transition-colors">
              <Activity className="w-12 h-12" />
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-cyber-red/5 border border-cyber-red/20 group-hover:neon-border-red transition-all">
                {getIcon(item.id === 'intel_draft' ? 'FileSearch' : item.id === 'evidence_decrypter' ? 'Unlock' : item.id === 'emp_jammer' ? 'Radio' : 'Shield')}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-white tracking-wide uppercase group-hover:text-cyber-red transition-colors">{item.name}</h3>
                <div className="text-xs font-mono text-cyber-red/60 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Archive className="w-3 h-3" />
                  Cost: {item.cost} XP
                </div>
              </div>
            </div>

            <p className="text-gray-400 font-mono text-xs leading-relaxed mb-6 flex-grow">
              {item.description}
            </p>

            {/* Special Options: Target Selection for EMP */}
            {item.id === 'emp_jammer' && (
              <div className="mb-6 space-y-3 p-3 bg-red-950/20 border border-cyber-red/10">
                <label className="text-[9px] font-display text-cyber-red uppercase tracking-widest">Target_Deployment_Zone:</label>
                <div className="flex flex-wrap gap-2">
                  {teams.length > 0 ? teams.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTargetId(t.id)}
                      className={`px-3 py-1.5 text-[10px] font-mono border transition-all ${
                        selectedTargetId === t.id 
                          ? 'bg-cyber-red border-cyber-red text-black font-bold' 
                          : 'border-cyber-red/20 text-cyber-red hover:bg-cyber-red/10'
                      }`}
                    >
                      {t.name}
                    </button>
                  )) : (
                    <span className="text-[10px] font-mono text-gray-600">NO_RIVALS_ONLINE</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => handleBuy(item.id)}
              disabled={purchasing !== null || (playerTeam && playerTeam.score < item.cost)}
              className={`w-full h-12 flex items-center justify-center gap-3 font-display uppercase tracking-widest transition-all ${
                purchasing === item.id 
                  ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/40 animate-pulse'
                  : 'bg-cyber-red text-black font-bold hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] clip-path-slant'
              }`}
            >
              {purchasing === item.id ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Authorize_Transaction
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-10 right-10 p-5 border flex items-center gap-4 shadow-2xl z-50 ${
              feedback.success ? 'bg-black border-cyber-green text-cyber-green' : 'bg-black border-cyber-red text-cyber-red'
            }`}
          >
            {feedback.success ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest font-bold">System_Feedback</div>
              <div className="text-xs font-mono">{feedback.message}</div>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
