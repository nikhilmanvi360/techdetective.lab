import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Terminal, Download, Copy, Check, Activity, ShieldAlert, Lock as LockIcon, Zap, Cpu, Database, Unlock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Evidence } from '../types';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';

function LineNumberedContent({ content, type, isEncrypted }: { content: string; type: string, isEncrypted?: boolean }) {
  const lines = content.split('\n');

  const baseColor = (type === 'log' || isEncrypted) ? 'text-green-900' :
    type === 'code' ? 'text-amber-900' :
      type === 'chat' ? 'text-blue-900' :
        'text-black';

  const scrambleLine = (line: string) => {
    if (!line.trim()) return '';
    return line.split('').map(c => Math.random() > 0.3 ? c : String.fromCharCode(33 + Math.floor(Math.random() * 94))).join('');
  };

  return (
    <div className={`font-mono text-sm ${isEncrypted ? 'adversary-glitch opacity-80 decoration-wavy underline decoration-red-500' : ''}`}>
      {lines.map((line, i) => {
        const displayLine = isEncrypted ? scrambleLine(line) : line;
        
        return (
        <div key={i} className="flex group hover:bg-[rgba(0,0,0,0.02)] transition-colors">
          <span className="select-none w-14 flex-shrink-0 text-right pr-4 text-gray-500 text-[11px] border-r-2 border-[rgba(0,0,0,0.2)] tabular-nums font-mono group-hover:text-black transition-colors pt-0.5">
            {(i + 1).toString().padStart(3, '0')}
          </span>
          <span className={`pl-4 flex-1 whitespace-pre-wrap break-all typewriter-text ${baseColor} ${!isEncrypted && (line.trim().startsWith('//') || line.trim().startsWith('#')) ? 'text-gray-500 italic' :
              !isEncrypted && (line.trim().startsWith('ERROR') || line.trim().startsWith('[ERROR]')) ? 'text-[#8b0000] font-bold' :
                !isEncrypted && (line.trim().startsWith('WARNING') || line.trim().startsWith('[WARN]')) ? 'text-amber-700 font-bold' :
                  !isEncrypted && (line.includes('===') || line.includes('---')) ? 'text-gray-400' :
                    ''
            }`}>
            {displayLine || '\u00A0'}
          </span>
        </div>
      )})}
    </div>
  );
}

export default function EvidenceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);
  const { playSound } = useSound();
  const { activeActions, resolveAction } = useAdversary();

  const encryptAction = activeActions.find(a => a.action_type === 'evidence_encrypt');

  useEffect(() => {
    if (!id) return;

    const fetchEvidence = async () => {
      try {
        const response = await fetch(`/api/evidence/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (response.ok) {
          setEvidence(data);
          playSound('ping');
        } else playSound('error');
      } catch (err) {
        playSound('error');
      } finally { setLoading(false); }
    };
    fetchEvidence();
  }, [id, playSound]);

  const handleCopy = () => {
    if (evidence && !encryptAction) {
      navigator.clipboard.writeText(evidence.content);
      playSound('click');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (encryptAction) playSound('error');
  };

  const handleDeIce = async () => {
    if (!encryptAction || resolving) return;
    playSound('click');
    if (!window.confirm(`Decryption protocol requires ${encryptAction.metadata?.cost_to_resolve || 25} XP. Proceed?`)) return;
    
    setResolving(true);
    const result = await resolveAction(encryptAction.id);
    if (result.success) playSound('success');
    else playSound('error');
    setResolving(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Search className="w-12 h-12 text-gray-500 animate-pulse" />
      <div className="typewriter-text text-gray-500 uppercase tracking-widest text-center">
        Dusting for prints...
      </div>
    </div>
  );

  if (!evidence) return <div className="text-[#8b0000] font-display tracking-widest text-center mt-20 uppercase font-bold text-xl">CRITICAL ERROR: EVIDENCE MISPLACED</div>;

  const metadata = typeof evidence.metadata === 'string' 
    ? JSON.parse(evidence.metadata) 
    : (evidence.metadata || {});

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      <button
        type="button"
        onClick={() => { playSound('click'); navigate(-1); }}
        className="flex items-center gap-2 text-[10px] font-sans font-bold text-black border-2 border-transparent hover:border-black transition-all uppercase tracking-widest px-2 py-1 bg-white hover:bg-gray-100 shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" /> Return to Dossier
      </button>

      {/* Main Evidence Envelope container */}
      <div className="paper-card p-0 relative transform rotate-[0.5deg]">
        <div className="pushpin top-4 right-4 z-20" />
        
        {/* Header - Looks like an evidence tag */}
        <div className="bg-[#eadda5] border-b-4 border-black p-8 flex items-end justify-between">
           <div className="flex gap-6 items-end">
             <div className="px-4 py-2 border-2 border-black bg-white flex flex-col items-center shadow-sm">
               <span className="font-sans font-bold text-[8px] uppercase tracking-widest text-gray-500 mb-1">EVIDENCE ID</span>
               <span className="font-display font-bold text-2xl tracking-tighter">#{evidence.id.toString().padStart(4, '0')}</span>
             </div>
             <div>
               <div className="font-sans font-bold text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Title / Description</div>
               <h1 className="text-4xl font-display font-bold text-black uppercase tracking-tight leading-none">
                 {evidence.title}
               </h1>
             </div>
           </div>

           <div className="flex gap-2">
             <button onClick={handleCopy} className="px-4 py-3 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2 group font-display font-bold text-xs uppercase tracking-widest shadow-sm">
               {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
             </button>
             <button className="px-4 py-3 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2 group font-display font-bold text-xs uppercase tracking-widest shadow-sm">
               <Download className="w-4 h-4" /> <span className="hidden sm:inline">SAVE</span>
             </button>
           </div>
        </div>

        {/* Metadata section */}
        <div className="px-8 py-4 border-b-2 border-black flex flex-wrap gap-8 items-center bg-[#f9f7f1]">
           <div className="flex items-center gap-2">
             <span className="px-2 py-1 bg-black text-white font-display font-bold text-[10px] uppercase tracking-widest">{evidence.type}</span>
           </div>
           {Object.entries(metadata).map(([key, value]) => {
              if (key === 'linkedPuzzles' || key === 'linkedEvidence') return null;
              return (
                <div key={key} className="flex gap-3 items-center">
                  <span className="font-sans font-bold text-[10px] text-gray-500 uppercase tracking-widest">{key}:</span>
                  <span className="typewriter-text text-sm font-bold text-black">{String(value)}</span>
                </div>
              );
           })}
           <div className="ml-auto flex gap-4">
             <div className="flex gap-2 items-center">
               <span className="font-sans font-bold text-[10px] text-gray-500 uppercase tracking-widest">Bytes:</span>
               <span className="font-mono text-sm font-bold">{evidence.content.length.toLocaleString()}</span>
             </div>
             <div className="flex gap-2 items-center">
               <span className="font-sans font-bold text-[10px] text-gray-500 uppercase tracking-widest">Lines:</span>
               <span className="font-mono text-sm font-bold">{evidence.content.split('\n').length}</span>
             </div>
           </div>
        </div>

        {/* Linked Records */}
        {((Array.isArray(metadata.linkedPuzzles) && metadata.linkedPuzzles.length > 0) || (Array.isArray(metadata.linkedEvidence) && metadata.linkedEvidence.length > 0)) && (
          <div className="bg-[#dfdbcc] border-b-2 border-black px-8 py-4 text-xs font-display flex flex-wrap gap-6 items-center">
             <span className="font-bold tracking-widest uppercase">CROSS-REFERENCES:</span>
             {(metadata.linkedPuzzles || []).map((pid: number) => (
                <Link key={`p-${pid}`} to={`/case/${evidence.case_id}#puzzle-${pid}`} className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors">
                  TASK_0x{pid}
                </Link>
             ))}
             {(metadata.linkedEvidence || []).map((eid: number) => (
                <Link key={`e-${eid}`} to={`/evidence/${eid}`} className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors">
                  FILE_0x{eid}
                </Link>
             ))}
          </div>
        )}

        {/* Paper Content Wrapper */}
        <div className="p-8 bg-[#fdfaf1] relative min-h-[400px]">
           {encryptAction && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-md">
                 <div className="bg-white border-4 border-[#8b0000] p-8 shadow-2xl text-center transform -rotate-2">
                    <LockIcon className="w-16 h-16 text-[#8b0000] mx-auto mb-4" />
                    <div className="stamp !scale-100 !text-[#8b0000] !border-[#8b0000] mx-auto mb-6">ENCRYPTED</div>
                    <p className="typewriter-text text-sm text-gray-800 mb-8">{encryptAction.metadata?.message || 'Intel is locked behind adversarial encryption.'}</p>
                    <button
                      onClick={handleDeIce}
                      disabled={resolving}
                      className="w-full border-[3px] border-[#8b0000] text-[#8b0000] font-display font-bold uppercase tracking-widest py-3 hover:bg-[#8b0000] hover:text-white transition-colors flex justify-center items-center gap-2"
                    >
                      {resolving ? 'DECRYPTING...' : `AUTHORIZE DECRYPTION (-${encryptAction.metadata?.cost_to_resolve || 25} XP)`}
                    </button>
                 </div>
              </div>
           )}

           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="leading-loose pl-2">
             <LineNumberedContent content={evidence.content} type={evidence.type} isEncrypted={!!encryptAction} />
           </motion.div>
        </div>
      </div>
    </div>
  );
}
