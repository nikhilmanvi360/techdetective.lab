import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCampaign } from '../../engine/campaignStore';
import { Shield, Search, User, ChevronRight } from 'lucide-react';

export default function RoleSelectionOverlay() {
  const { state, dispatch } = useCampaign();
  const [p1Role, setP1Role] = useState<'Lead Investigator' | 'Forensic Tech' | null>(null);
  const [p2Role, setP2Role] = useState<'Lead Investigator' | 'Forensic Tech' | null>(null);

  if (state.teamRoles) return null;

  const handleComplete = () => {
    if (p1Role && p2Role) {
      dispatch({ type: 'SET_ROLES', roles: { p1: p1Role, p2: p2Role } });
    }
  };

  const isReady = p1Role && p2Role && p1Role !== p2Role;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a0502]/95 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#e8d5a0] border-[6px] border-[#2a1a0a] shadow-2xl p-10 max-w-2xl w-full"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}
      >
        {/* Frame Decoration */}
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#a07830]/30 pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className="mb-2">
            <span className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em]">Bureau of Investigation</span>
          </div>
          <h2 className="text-4xl font-serif font-black text-[#2a1a0a] mb-8 uppercase tracking-tight">Team Assignment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Player 1 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-[2px] bg-[#a07830]/30" />
                <span className="text-[10px] font-black text-[#a07830] uppercase">Agent One</span>
                <div className="w-8 h-[2px] bg-[#a07830]/30" />
              </div>
              
              <RoleButton 
                active={p1Role === 'Lead Investigator'} 
                onClick={() => setP1Role('Lead Investigator')}
                icon={<Search className="w-4 h-4" />}
                title="Lead Investigator"
                desc="Evidence discovery and field deduction."
              />
              <RoleButton 
                active={p1Role === 'Forensic Tech'} 
                onClick={() => setP1Role('Forensic Tech')}
                icon={<Shield className="w-4 h-4" />}
                title="Forensic Tech"
                desc="Terminal protocols and technical analysis."
              />
            </div>

            {/* Player 2 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-[2px] bg-[#a07830]/30" />
                <span className="text-[10px] font-black text-[#a07830] uppercase">Agent Two</span>
                <div className="w-8 h-[2px] bg-[#a07830]/30" />
              </div>
              
              <RoleButton 
                active={p2Role === 'Lead Investigator'} 
                onClick={() => setP2Role('Lead Investigator')}
                icon={<Search className="w-4 h-4" />}
                title="Lead Investigator"
                desc="Evidence discovery and field deduction."
              />
              <RoleButton 
                active={p2Role === 'Forensic Tech'} 
                onClick={() => setP2Role('Forensic Tech')}
                icon={<Shield className="w-4 h-4" />}
                title="Forensic Tech"
                desc="Terminal protocols and technical analysis."
              />
            </div>
          </div>

          {!isReady && p1Role && p2Role && p1Role === p2Role && (
            <p className="text-red-800 text-[10px] font-black uppercase mb-4 tracking-wider">Warning: Agents must have distinct specialties.</p>
          )}

          <button
            disabled={!isReady}
            onClick={handleComplete}
            className={`group relative px-8 py-3 overflow-hidden transition-all duration-300 ${isReady ? 'bg-[#2a1a0a] text-[#d4a017] hover:scale-105 active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <span className="relative z-10 flex items-center gap-3 font-black uppercase tracking-widest text-xs">
              Open Case File <ChevronRight className={`w-4 h-4 transition-transform ${isReady ? 'group-hover:translate-x-1' : ''}`} />
            </span>
            {isReady && <div className="absolute inset-0 bg-[#d4a017]/10 translate-y-full group-hover:translate-y-0 transition-transform" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleButton({ active, onClick, icon, title, desc }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 text-left transition-all duration-200 group ${active ? 'bg-[#2a1a0a] border-[#2a1a0a] text-[#e8d5a0]' : 'bg-[#e8d5a0] border-[#a07830]/30 text-[#2a1a0a] hover:border-[#a07830]'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${active ? 'text-[#d4a017]' : 'text-[#a07830]'}`}>
          {icon}
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider mb-0.5">{title}</div>
          <div className={`text-[10px] font-serif italic ${active ? 'text-[#e8d5a0]/70' : 'text-[#2a1a0a]/60'}`}>{desc}</div>
        </div>
      </div>
    </button>
  );
}
