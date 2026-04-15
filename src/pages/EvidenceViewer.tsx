import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Terminal, Download, Copy, Check, Link as LinkIcon, Activity, Send, ShieldAlert, History, Lock as LockIcon, Zap, Cpu, User, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Evidence } from '../types';
import { useSound } from '../hooks/useSound';

function LineNumberedContent({ content, type }: { content: string; type: string }) {
  const lines = content.split('\n');
  
  const baseColor = type === 'log' ? 'text-cyber-green' : 
                     type === 'code' ? 'text-cyber-amber' : 
                     type === 'chat' ? 'text-cyber-blue' :
                     'text-gray-300';

  return (
    <div className="font-mono text-sm">
      {lines.map((line, i) => (
        <div key={i} className="flex group hover:bg-white/[0.02] transition-colors">
          <span className="select-none w-14 flex-shrink-0 text-right pr-4 text-gray-700 text-[11px] border-r border-cyber-line/30 tabular-nums font-display group-hover:text-gray-500 transition-colors">
            {(i + 1).toString().padStart(3, ' ')}
          </span>
          <span className={`pl-4 flex-1 whitespace-pre-wrap break-all ${baseColor} ${
            line.trim().startsWith('//') || line.trim().startsWith('#') ? 'text-gray-600 italic' :
            line.trim().startsWith('ERROR') || line.trim().startsWith('[ERROR]') ? 'text-cyber-red' :
            line.trim().startsWith('WARNING') || line.trim().startsWith('[WARN]') ? 'text-cyber-amber' :
            line.includes('===') || line.includes('---') ? 'text-gray-600' :
            ''
          }`}>
            {line || '\u00A0'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EvidenceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { playSound } = useSound();

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
        } else {
          playSound('error');
        }
      } catch (err) {
        playSound('error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [id, playSound]);

  const handleCopy = () => {
    if (evidence) {
      navigator.clipboard.writeText(evidence.content);
      playSound('click');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Activity className="w-12 h-12 text-cyber-blue animate-pulse" />
      <div className="font-display text-cyber-blue uppercase tracking-[0.4em] flicker-anim text-center">
        Decrypting_Data_Stream...
      </div>
    </div>
  );

  if (!evidence) return <div className="text-cyber-red font-display tracking-widest text-center mt-20">CRITICAL_ERROR: EVIDENCE_NOT_FOUND</div>;

  const metadata = evidence.metadata ? JSON.parse(evidence.metadata) : {};

  return (
    <div className="space-y-10">
      <button 
        type="button"
        onClick={() => { playSound('click'); navigate(-1); }}
        className="flex items-center gap-2 text-[10px] font-display text-gray-500 hover:text-cyber-green transition-all uppercase tracking-[0.3em] group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Return_to_Node_Analogue
      </button>

      <div className="cyber-panel border-cyber-blue/30 overflow-hidden relative gradient-border">
        {/* Decorative Scans */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/40 to-transparent" />
        
        <div className="bg-black/80 px-8 py-5 border-b border-cyber-line flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-cyber-blue/40 relative">
              <Database className="w-5 h-5 text-cyber-blue flicker-anim" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyber-blue rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-display text-cyber-blue uppercase tracking-widest">Evidence_Object_{evidence.id}</span>
              <span className="text-lg font-display font-bold text-white uppercase tracking-tight">{evidence.title.replace(' ', '_')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 border border-cyber-line text-gray-400 hover:border-cyber-green hover:text-cyber-green hover:bg-cyber-green/5 transition-all flex items-center gap-2 group"
              title="Copy to Local Memory"
            >
              {copied ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-display uppercase tracking-widest hidden sm:block">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              type="button"
              className="px-4 py-2 border border-cyber-line text-gray-400 hover:border-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/5 transition-all flex items-center gap-2 group"
              title="Download Binary Data"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span className="text-[10px] font-display uppercase tracking-widest hidden sm:block">Download</span>
            </button>
          </div>
        </div>

        {/* Metadata HUD */}
        <div className="bg-black/40 border-b border-cyber-line px-8 py-3 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <Activity className="w-3 h-3 text-cyber-green" />
            <span className="text-[9px] font-display text-cyber-green uppercase tracking-[0.2em]">{evidence.type}_ENCODED</span>
          </div>
          <div className="w-[1px] h-4 bg-cyber-line" />
          <div className="flex flex-wrap items-center gap-6">
            {Object.entries(metadata).map(([key, value]) => {
              if (key === 'linkedPuzzles' || key === 'linkedEvidence') return null;
              return (
                <div key={key} className="flex flex-col">
                  <span className="text-[8px] font-display text-gray-600 uppercase mb-0.5">{key}</span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{String(value)}</span>
                </div>
              );
            })}
          </div>
          <div className="ml-auto text-[9px] font-mono text-gray-500 tabular-nums uppercase tracking-widest">
            Size: {evidence.content.length.toLocaleString()} Bytes | Lines: {evidence.content.split('\n').length}
          </div>
        </div>
        
        {/* Linked Records */}
        {(metadata.linkedPuzzles?.length > 0 || metadata.linkedEvidence?.length > 0) && (
          <div className="bg-black/60 px-8 py-4 flex flex-wrap items-center gap-10 border-b border-cyber-line">
            {metadata.linkedPuzzles?.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-display text-cyber-blue uppercase tracking-widest">Linked_Puzzles:</span>
                <div className="flex gap-2">
                  {metadata.linkedPuzzles.map((pid: number) => (
                    <Link 
                      key={`p-${pid}`} 
                      to={`/case/${evidence.case_id}#puzzle-${pid}`}
                      onClick={() => playSound('click')}
                      className="px-2 py-0.5 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 text-[10px] font-display transition-all"
                    >
                      TASK_0x{pid}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {metadata.linkedEvidence?.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-display text-cyber-green uppercase tracking-widest">Cross_References:</span>
                <div className="flex gap-2">
                  {metadata.linkedEvidence.map((eid: number) => (
                    <Link 
                      key={`e-${eid}`} 
                      to={`/evidence/${eid}`}
                      onClick={() => playSound('click')}
                      className="px-2 py-0.5 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20 text-[10px] font-display transition-all"
                    >
                      FILE_0x{eid}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Binary Content Area — with line numbers */}
        <div className="p-6 overflow-x-auto relative custom-scrollbar">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none p-4">
             <ShieldAlert className="w-full h-full text-cyber-blue" />
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="leading-relaxed"
          >
            <LineNumberedContent content={evidence.content} type={evidence.type} />
          </motion.div>
        </div>

        <div className="bg-black/80 p-6 border-t border-cyber-line flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[9px] font-display text-cyber-green uppercase tracking-[0.3em]">Integrity_Check: Pass</span>
            </div>
            <div className="w-[1px] h-3 bg-cyber-line" />
            <div className="text-[9px] font-display text-gray-500 uppercase tracking-widest">View_Window: SSL_ENCRYPTED</div>
          </div>
          <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest tabular-nums font-bold">
            0x{Math.random().toString(16).slice(2, 10).toUpperCase()} // HEX_DUMP_TAIL
          </span>
        </div>
      </div>

      {/* Analysis Tools Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-panel p-6 space-y-4 border-cyber-blue/20 corner-brackets">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-cyber-blue" />
            <h4 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">Matrix Analysis</h4>
          </div>
          <div className="space-y-3">
            <div className="h-1 bg-cyber-line overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '92%' }}
                transition={{ duration: 1.5 }}
                className="h-full bg-gradient-to-r from-cyber-blue to-cyber-violet" 
              />
            </div>
            <p className="text-[9px] font-display text-gray-500 uppercase tracking-widest">Consistency: 92.4% Verified</p>
          </div>
        </div>
        
        <div className="cyber-panel p-6 space-y-4 border-cyber-green/20 corner-brackets">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-cyber-green" />
            <h4 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">Pattern Recognition</h4>
          </div>
          <p className="text-[9px] font-display text-cyber-green uppercase tracking-widest animate-pulse">Running active anomaly sweep...</p>
        </div>

        <div className="cyber-panel p-6 space-y-4 border-cyber-amber/20 corner-brackets">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyber-amber" />
            <h4 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">Investigator_Notes</h4>
          </div>
          <p className="text-[9px] font-display text-gray-500 italic uppercase tracking-widest leading-loose">
            "Observe the frequency of host-to-host handshakes in section AAF4."
          </p>
        </div>
      </div>
    </div>
  );
}
