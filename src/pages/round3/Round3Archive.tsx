import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, FileText, Search, Database, Lock, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function Round3Archive() {
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [monologueActive, setMonologueActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const totalFolders = 89;
  const targetFolder = 87;

  // Generate folder structure
  const folders = Array.from({ length: totalFolders }, (_, i) => ({
    id: i + 1,
    name: `batch_${String(i + 1).padStart(3, '0')}`,
    isTarget: i + 1 === targetFolder
  }));

  const handleFileClick = (isTarget: boolean) => {
    if (isTarget) {
      setRevealed(true);
      setTimeout(() => {
        setMonologueActive(true);
      }, 2000);
    }
  };

  const completeArchive = () => {
    setMonologueActive(false);
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-[#0a0805] text-[#f4e6c4] font-mono flex flex-col items-center justify-center p-10 text-center">
        <Zap className="w-20 h-20 text-[#d4a017] mb-8 animate-pulse" />
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Phase Concluded</h1>
        <p className="text-[#a07830] max-w-xl uppercase tracking-widest text-sm leading-relaxed mb-12">
          The true simulation parameters have been extracted. Proceed to The Verdict to finalize the investigation.
        </p>
        <button 
          onClick={() => navigate('/board')}
          className="px-10 py-4 bg-[#d4a017] text-black font-black uppercase tracking-widest hover:bg-[#f0d070] transition-colors"
        >
          Return to Mission Board
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f4e6c4] font-mono flex flex-col">
      <AnimatePresence mode="wait">
        {monologueActive && (
          <motion.div
            key="monologue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-20"
          >
            <div className="max-w-3xl w-full space-y-12 border-2 border-[#d4a017] p-16 bg-[#0c0803] relative overflow-hidden">
               {/* Scanning effect */}
               <motion.div 
                 animate={{ y: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                 className="absolute inset-x-0 h-1 bg-[#d4a017]/20 z-0"
               />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4 text-[#d4a017]">
                     <Zap className="w-8 h-8 animate-pulse" />
                     <h2 className="text-4xl font-black uppercase tracking-tighter">Decryption Successful</h2>
                  </div>
                  
                  <div className="space-y-6 font-mono text-sm leading-relaxed text-[#f4e6c4]">
                     <p className="text-[#a07830]">
                       [SYSTEM_LOG]: Simulation parameters isolated in run_31.sim.
                     </p>
                     <div className="p-8 bg-black/50 border border-[#3a2810] space-y-4">
                        <div className="flex justify-between border-b border-[#3a2810] pb-2 text-[10px] text-[#d4a017] font-black uppercase tracking-widest">
                           <span>Parameter</span>
                           <span>Value</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-[#a07830]">EXTRACTED_KEY:</span>
                           <span className="text-white">VERDICT_2026</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-[#a07830]">PURPOSE:</span>
                           <span className="text-white">LIVE_BANK_HEIST_REHEARSAL</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-[#a07830]">ACTOR:</span>
                           <span className="text-white">KARAN_SEHGAL</span>
                        </div>
                     </div>
                     <p>
                       The evidence is conclusive. Karan Sehgal was not running tests; he was rehearsing the extraction logic against the live Meridian Bank production core.
                     </p>
                  </div>

                  <button 
                    onClick={completeArchive}
                    className="w-full py-4 bg-[#d4a017] text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-[#f0d070] transition-colors"
                  >
                    Proceed to Verdict
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-20 border-b-2 border-[#3a2810] bg-[#140e06] flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#d4a017]" />
                  <div>
                      <h1 className="text-[10px] font-black uppercase tracking-[0.4em]">Compliance Data Lake</h1>
                      <p className="text-[8px] text-[#a07830] uppercase tracking-widest mt-0.5">Protocol: Deep Search</p>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-4 border border-[#3a2810] bg-black px-4 py-2">
            <Search className="w-4 h-4 text-[#a07830]" />
            <span className="text-xs text-[#a07830] uppercase tracking-widest">Index: 89 Batches</span>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Pane: Folder Grid */}
        <div className="w-1/2 border-r-2 border-[#3a2810] bg-[#0c0803] p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-4 gap-4">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`p-4 flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  activeFolder === folder.id 
                    ? 'border-[#d4a017] bg-[#d4a017]/10' 
                    : 'border-[#3a2810] bg-black hover:border-[#a07830]'
                }`}
              >
                <Folder className={`w-8 h-8 ${activeFolder === folder.id ? 'text-[#d4a017]' : 'text-[#a07830]'}`} />
                <span className="text-[10px] uppercase font-black tracking-widest text-[#f4e6c4]">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: Folder Contents */}
        <div className="w-1/2 bg-[#0a0805] p-8 overflow-y-auto relative">
          {!activeFolder ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <Folder className="w-16 h-16 text-[#a07830] mb-4" />
              <span className="text-xs uppercase tracking-widest font-black text-[#a07830]">Select a batch to inspect</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-[#3a2810] pb-4">
                <Folder className="w-6 h-6 text-[#d4a017]" />
                <h2 className="text-xl font-black uppercase tracking-widest text-[#f4e6c4]">batch_{String(activeFolder).padStart(3, '0')}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Generate 5 dummy files */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleFileClick(false)}
                    className="flex items-center justify-between p-4 border border-[#3a2810] bg-[#0c0803] hover:bg-[#1a1208] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-[#a07830] group-hover:text-[#d4a017]" />
                      <span className="text-sm font-mono text-[#f4e6c4]">run_{String(i + 1).padStart(2, '0')}.sim</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a07830] bg-[#1a1208] px-2 py-1">TEST_CONFIG</span>
                  </button>
                ))}

                {/* Inject Target File if Target Folder */}
                {activeFolder === targetFolder && (
                  <button
                    onClick={() => handleFileClick(true)}
                    className={`flex items-center justify-between p-4 border transition-colors group ${
                      revealed ? 'border-green-500 bg-green-900/20' : 'border-red-900/50 bg-red-900/10 hover:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className={`w-5 h-5 ${revealed ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-mono ${revealed ? 'text-green-400' : 'text-red-400'}`}>run_31.sim</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 ${
                      revealed ? 'text-green-500 bg-green-900/40' : 'text-red-500 bg-red-900/40'
                    }`}>
                      {revealed ? 'DECRYPTED' : 'LIVE_RUN_PARAMS'}
                    </span>
                  </button>
                )}

                {/* Additional dummy files for padding */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <button
                    key={i + 10}
                    onClick={() => handleFileClick(false)}
                    className="flex items-center justify-between p-4 border border-[#3a2810] bg-[#0c0803] hover:bg-[#1a1208] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-[#a07830] group-hover:text-[#d4a017]" />
                      <span className="text-sm font-mono text-[#f4e6c4]">run_{String(i + 6 + (activeFolder === targetFolder ? 1 : 0)).padStart(2, '0')}.sim</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a07830] bg-[#1a1208] px-2 py-1">TEST_CONFIG</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
