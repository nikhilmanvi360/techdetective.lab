import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Skull, Zap, Shield, 
  Activity, Terminal, Lock, AlertCircle,
  Radio, Archive, ChevronRight, Check,
  Briefcase
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
      setFeedback({ success: false, message: 'ERROR: Specify a department for interference.' });
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
      setFeedback({ success: false, message: 'Link Error: Requisition Interrupted' });
      playSound('error');
    } finally {
      setPurchasing(null);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileSearch': return <Terminal className="w-5 h-5 text-gray-700" />;
      case 'Unlock': return <Lock className="w-5 h-5 text-gray-700" />;
      case 'Radio': return <Radio className="w-5 h-5 text-gray-700" />;
      case 'Shield': return <Shield className="w-5 h-5 text-gray-700" />;
      default: return <Briefcase className="w-5 h-5 text-gray-700" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Briefcase className="w-12 h-12 text-gray-500 animate-pulse" />
        <div className="font-display text-gray-500 uppercase tracking-widest typewriter-text">
          Opening Requisition Drawer...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20 mt-4 relative">
      {/* Clipboard Top Clip Decoration */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-gray-300 border-2 border-gray-600 rounded-t-lg z-20 shadow-md flex items-center justify-center">
        <div className="w-32 h-2 bg-gray-400 border border-gray-500 rounded-full" />
      </div>

      <div className="bg-[#fcf8e3] border-4 border-[#bca075] p-8 md:p-12 shadow-2xl relative">
        {/* Header Panel */}
        <div className="border-b-4 border-black pb-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#8b0000] mb-2">
                <span className="text-[14px] font-sans uppercase tracking-[0.3em] font-bold py-1 border-b-2 border-[#8b0000]">CONFIDENTIAL REQUISITION</span>
              </div>
              <h1 className="text-5xl font-display font-bold text-black tracking-tight uppercase">
                Under-The-Table <span className="text-gray-600 underline">Favors</span>
              </h1>
              <p className="text-gray-700 font-mono text-sm max-w-xl typewriter-text mt-4 leading-relaxed font-bold">
                Cashing in your hard-earned favors (XP). All requests require immediate signature and are strictly non-refundable. Paper trail will be shredded.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 bg-white border-4 border-black p-6 shadow-sm transform rotate-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-black" />
                <span className="text-xs font-sans text-gray-500 uppercase tracking-widest font-bold">AVAILABLE XP</span>
              </div>
              <span className="text-4xl font-display font-bold text-black tracking-tighter tabular-nums">
                {playerTeam?.score?.toLocaleString() || 0} <span className="text-sm text-gray-500 font-normal">XP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Item Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`group flex flex-col h-full bg-white border-2 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,0.1)] relative transition-all ${
                playerTeam && playerTeam.score < item.cost ? 'opacity-50 grayscale' : 'hover:translate-x-[-2px] hover:-translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-start gap-4 mb-4 border-b-2 border-[rgba(0,0,0,0.1)] pb-4">
                <div className="p-3 border-2 border-black bg-gray-100 transform -rotate-2 shadow-sm">
                  {getIcon(item.id === 'intel_draft' ? 'FileSearch' : item.id === 'evidence_decrypter' ? 'Unlock' : item.id === 'emp_jammer' ? 'Radio' : 'Shield')}
                </div>
                <div className="space-y-1 w-full">
                  <h3 className="text-2xl font-display font-bold text-black tracking-tight uppercase leading-none">{item.name}</h3>
                  <div className="text-sm font-sans font-bold uppercase tracking-widest flex items-center justify-between gap-2 text-gray-500 mt-2 border-t border-[rgba(0,0,0,0.1)] pt-2">
                    <span>REQ_COST:</span>
                    <span className="text-black tabular-nums border px-2 py-0.5 bg-gray-100">{item.cost} XP</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-800 font-mono text-sm leading-loose mb-6 flex-grow">
                {item.description}
              </p>

              {/* Special Options: Target Selection for EMP */}
              {item.id === 'emp_jammer' && (
                <div className="mb-6 space-y-3 p-4 bg-gray-100 border-2 border-dashed border-gray-400">
                  <label className="text-xs font-sans font-bold text-black uppercase tracking-widest">Select Target Department:</label>
                  <div className="flex flex-wrap gap-2">
                    {teams.length > 0 ? teams.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTargetId(t.id)}
                        className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 transition-all ${
                          selectedTargetId === t.id 
                            ? 'bg-black border-black text-white' 
                            : 'bg-white border-[rgba(0,0,0,0.2)] text-gray-600 hover:border-black hover:text-black'
                        }`}
                      >
                        {t.name}
                      </button>
                    )) : (
                      <span className="text-xs font-mono font-bold text-[#8b0000]">No targets in range</span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleBuy(item.id)}
                disabled={purchasing !== null || (playerTeam && playerTeam.score < item.cost)}
                className={`w-full h-12 flex items-center justify-center gap-3 font-display font-bold text-sm uppercase tracking-widest transition-all border-2 ${
                  purchasing === item.id 
                    ? 'bg-gray-200 text-gray-500 border-gray-400 cursor-wait'
                    : 'bg-white border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                {purchasing === item.id ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Filing Paperwork...
                  </>
                ) : (
                  <>
                    SIGN REQUISITION FORM
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 border-4 flex flex-col items-center gap-4 shadow-2xl z-50 transform rotate-1 ${
              feedback.success ? 'bg-white border-green-800 text-green-900' : 'bg-white border-[#8b0000] text-[#8b0000]'
            }`}
          >
            <div className={`stamp !scale-100 ${feedback.success ? '!border-green-800 !text-green-800' : '!border-[#8b0000] !text-[#8b0000]'}`}>
               {feedback.success ? 'APPROVED' : 'DENIED'}
            </div>
            
            <div className="text-center mt-4">
              <div className="text-sm font-sans uppercase tracking-widest font-bold text-gray-500 mb-2">Clerk's Note</div>
              <div className="text-lg font-mono font-bold">{feedback.message}</div>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              className="mt-6 px-6 py-2 border-2 border-black text-black font-display font-bold uppercase hover:bg-black hover:text-white transition-colors"
            >
              Acknowledge
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
