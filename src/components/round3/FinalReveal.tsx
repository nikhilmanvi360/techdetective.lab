import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle2, Zap, AlertTriangle, User } from 'lucide-react';

export default function FinalReveal({ data }: { data: any }) {
  const [showShutdown, setShowShutdown] = useState(false);
  const [majorityData, setMajorityData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/r3/majority?correctSuspect=${data?.correctEntity || 'SYNDICATE_AI'}`)
      .then(res => res.json())
      .then(result => setMajorityData(result));

    const timer = setTimeout(() => {
      setShowShutdown(true);
    }, 20000); // Extended reveal
    return () => clearTimeout(timer);
  }, [data]);

  const isSuccess = majorityData?.isCorrect;

  return (
    <div className={`min-h-screen ${isSuccess ? 'bg-black' : 'bg-[#1a0505]'} flex items-center justify-center p-8 overflow-hidden transition-colors duration-1000`}>
      <AnimatePresence>
        {!showShutdown ? (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="max-w-4xl w-full space-y-12 text-center"
          >
            <div className={`inline-flex items-center gap-3 px-6 py-2 border-2 rounded-full ${isSuccess ? 'bg-[#d4a017]/10 border-[#d4a017]/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <Shield className={`w-5 h-5 ${isSuccess ? 'text-[#d4a017]' : 'text-red-500'}`} />
              <span className={`text-sm font-black uppercase tracking-[0.4em] ${isSuccess ? 'text-[#d4a017]' : 'text-red-500'}`}>
                {isSuccess ? 'Final Verdict Delivered' : 'Critical Investigation Failure'}
              </span>
            </div>

            <div className="space-y-6">
              {isSuccess ? (
                <>
                  <h1 className="text-6xl md:text-8xl font-black text-[#f4e6c4] uppercase tracking-tighter">
                    THE BUREAU <span className="text-[#d4a017]">PREVAILED</span>
                  </h1>
                  <p className="text-[#a07830] font-mono text-lg italic max-w-2xl mx-auto">
                    The majority ({(majorityData?.voteCount / majorityData?.totalVotes * 100).toFixed(0)}%) of teams correctly identified <span className="text-[#f4e6c4] font-black">{majorityData?.suspect}</span>. The syndicate network has been neutralized.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-6xl md:text-8xl font-black text-red-600 uppercase tracking-tighter">
                    SYNDICATE <span className="text-white">EVADED</span>
                  </h1>
                  <p className="text-red-400 font-mono text-lg italic max-w-2xl mx-auto">
                    Misdirection won. The majority of investigators pursued <span className="text-white font-black">{majorityData?.suspect}</span> while the true threat escaped.
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-20">
              <div className="bg-[#0c0803] border-2 border-[#3a2810] p-8 space-y-4 relative overflow-hidden">
                 <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Consensus Report
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-[#3a2810] pb-2">
                       <span className="text-[#f4e6c4]/40 font-mono text-[10px]">Top Accusation</span>
                       <span className={`text-sm font-black uppercase ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>{majorityData?.suspect}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-[#3a2810] pb-2">
                       <span className="text-[#f4e6c4]/40 font-mono text-[10px]">Vote Strength</span>
                       <span className="text-[#f4e6c4] font-black">{majorityData?.voteCount} / {majorityData?.totalVotes} UNITS</span>
                    </div>
                 </div>
              </div>
              <div className={`bg-[#0c0803] border-2 p-8 space-y-4 ${isSuccess ? 'border-[#3a2810]' : 'border-red-900/50'}`}>
                 <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isSuccess ? 'text-[#a07830]' : 'text-red-500'}`}>
                    <Zap className={`w-4 h-4 ${!isSuccess && 'animate-pulse'}`} /> {isSuccess ? 'System Security' : 'System Breach'}
                 </div>
                 <p className={`text-xs font-mono leading-relaxed uppercase ${isSuccess ? 'text-[#a07830]' : 'text-red-400'}`}>
                    {isSuccess 
                      ? `The encryption keys were recovered. The city remains secure under Bureau oversight.`
                      : `The kill-code was authorized. System logs are being purged. The Syndicate wins this round.`}
                 </p>
              </div>
            </div>
            
            <div className="pt-20">
               <div className={`text-[10px] font-black uppercase tracking-[0.8em] animate-pulse ${isSuccess ? 'text-[#d4a017]' : 'text-red-600'}`}>
                  {isSuccess ? 'Secure Logout Initiated' : 'Emergency Shutdown Required'}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="shutdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`fixed inset-0 flex flex-col items-center justify-center space-y-12 z-50 ${isSuccess ? 'bg-black' : 'bg-red-950'}`}
          >
            <div className={`w-64 h-[1px] relative ${isSuccess ? 'bg-[#d4a017]' : 'bg-red-500'}`}>
              <motion.div 
                initial={{ width: '0%' }} 
                animate={{ width: '100%' }} 
                transition={{ duration: 4, ease: "easeInOut" }}
                className={`absolute inset-0 ${isSuccess ? 'bg-[#f0d070] shadow-[0_0_20px_#f0d070]' : 'bg-red-400 shadow-[0_0_20px_#ef4444]'}`}
              />
            </div>
            <div className={`text-[10px] font-black uppercase tracking-[1em] animate-pulse ${isSuccess ? 'text-[#d4a017]' : 'text-red-500'}`}>
              {isSuccess ? (data?.aiName || 'AI') : 'SYNDICATE'} // OFFLINE
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
               <div className="glitch-overlay" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .glitch-overlay {
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
