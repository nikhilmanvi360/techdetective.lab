import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '../../engine/campaignStore';
import { Shield, BookOpen, Package } from 'lucide-react';

export default function CaseResolution() {
  const { state } = useCampaign();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0a0702]/95"
    >
      <div className="max-w-2xl w-full mx-4">
        <div className="relative bg-[#e8d5a0] border-4 border-[#a07830] shadow-2xl p-10"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-[#8B2020] mx-auto mb-4" />
            <div className="text-[10px] text-[#8B2020] font-black uppercase tracking-[0.4em] mb-2">
              Case Closed
            </div>
            <h2 className="text-4xl font-black text-[#2a1a0a] uppercase tracking-tighter font-serif italic">
              ARGUS Deactivated
            </h2>
            <div className="w-24 h-[2px] bg-[#a07830] mx-auto mt-4" />
          </div>

          {/* Summary */}
          <div className="space-y-4 mb-8">
            <div className="bg-[#2a1a0a]/10 border-l-4 border-[#8B2020] px-4 py-3">
              <p className="text-sm font-serif text-[#2a1a0a] leading-relaxed">
                <strong>Perpetrator:</strong> Raza Malik — alias <em>sys_ghost</em>, former student, 
                system administrator back-door account holder.
              </p>
            </div>
            <div className="bg-[#2a1a0a]/10 border-l-4 border-[#a07830] px-4 py-3">
              <p className="text-sm font-serif text-[#2a1a0a] leading-relaxed">
                <strong>Method:</strong> ARGUS_PROTOCOL_V2 deployed via dormant admin account. 
                Power node manipulation, decoy terminals, and grade record tampering.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center border-2 border-[#a07830]/30 p-3">
              <Package className="w-5 h-5 text-[#a07830] mx-auto mb-1" />
              <div className="text-xl font-black text-[#2a1a0a]">{state.inventory.length}</div>
              <div className="text-[8px] text-[#a07830] uppercase tracking-widest font-black">Items</div>
            </div>
            <div className="text-center border-2 border-[#a07830]/30 p-3">
              <BookOpen className="w-5 h-5 text-[#a07830] mx-auto mb-1" />
              <div className="text-xl font-black text-[#2a1a0a]">{state.clues.length}</div>
              <div className="text-[8px] text-[#a07830] uppercase tracking-widest font-black">Clues</div>
            </div>
            <div className="text-center border-2 border-[#a07830]/30 p-3">
              <Shield className="w-5 h-5 text-[#8B2020] mx-auto mb-1" />
              <div className="text-xl font-black text-[#2a1a0a]">4/4</div>
              <div className="text-[8px] text-[#a07830] uppercase tracking-widest font-black">Zones</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#2a1a0a] text-[#d4a017] py-3 font-black uppercase tracking-widest text-sm hover:bg-[#d4a017] hover:text-[#2a1a0a] transition-colors border-2 border-[#a07830]"
          >
            Return to Bureau
          </button>
        </div>
      </div>
    </motion.div>
  );
}
