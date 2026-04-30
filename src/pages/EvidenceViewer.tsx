import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ChevronLeft, Terminal, Download, Copy, Check, Activity,
  ShieldAlert, Lock as LockIcon, Zap, Cpu, Database, Unlock, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Evidence } from '../types';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';
import { getRankTitle } from '../utils/ranks';

/* ─── Line Numbered Content ────────────────────────────────── */
function LineNumberedContent({ content, type, isEncrypted }: { content: string; type: string, isEncrypted?: boolean }) {
  const lines = content.split('\n');

  const baseColor = (type === 'log' || isEncrypted) ? 'text-[#1a0e04]' :
    type === 'code' ? 'text-[#2a1c0a]' :
      type === 'chat' ? 'text-[#3a2a10]' :
        'text-[#1a0e04]';

  const scrambleLine = (line: string) => {
    if (!line.trim()) return '';
    return line.split('').map(c => Math.random() > 0.3 ? c : String.fromCharCode(33 + Math.floor(Math.random() * 94))).join('');
  };

  return (
    <div className={`font-mono text-sm leading-relaxed ${isEncrypted ? 'opacity-40 select-none pointer-events-none' : ''}`}>
      {lines.map((line, i) => {
        const displayLine = isEncrypted ? scrambleLine(line) : line;

        return (
          <div key={i} className="flex group hover:bg-black/5 transition-colors">
            <span className="select-none w-14 flex-shrink-0 text-right pr-4 text-[#1a0e04]/30 text-[11px] border-r border-[#1a0e04]/10 tabular-nums font-display group-hover:text-[#1a0e04]/50 transition-colors">
              {(i + 1).toString().padStart(3, ' ')}
            </span>
            <span className={`pl-4 flex-1 whitespace-pre-wrap break-all ${baseColor} ${!isEncrypted && (line.trim().startsWith('//') || line.trim().startsWith('#')) ? 'opacity-40 italic' :
              !isEncrypted && (line.trim().startsWith('ERROR') || line.trim().startsWith('[ERROR]')) ? 'text-red-900 font-bold' :
                !isEncrypted && (line.trim().startsWith('WARNING') || line.trim().startsWith('[WARN]')) ? 'text-[#B8860B]' :
                  ''
              }`}>
              {displayLine || '\u00A0'}
            </span>
          </div>
        )
      })}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
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
  const { team } = useOutletContext<{ team: any }>();
  const rankTitle = getRankTitle(team?.score || 0);
  const xp = team?.score || 0;
  const xpPct = Math.min(100, Math.round((xp / 500) * 100));

  useEffect(() => {
    if (!id) return;

    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/evidence/${id}`, {
          headers: { 'Authorization': `Bearer ${''}` }
        });
        const data = await response.json();
        if (response.ok) {
          setEvidence(data);
          playSound('ping');
        } else if (data.is_encrypted) {
          setEvidence({ id: parseInt(id), title: 'SCRAMBLED_DATA', content: '0x00'.repeat(100), type: 'log', case_id: 0 } as any);
          playSound('error');
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
    if (evidence && !encryptAction) {
      navigator.clipboard.writeText(evidence.content);
      playSound('click');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (encryptAction) {
      playSound('error');
    }
  };

  const handleDeIce = async () => {
    if (!encryptAction || resolving) return;
    playSound('click');
    if (!window.confirm(`De-Icing will deduct ${encryptAction.metadata?.cost_to_resolve || 25} XP. Proceed?`)) return;

    setResolving(true);
    const result = await resolveAction(encryptAction.id);
    if (result.success) {
      playSound('success');
    } else {
      playSound('error');
    }
    setResolving(false);
  };

  const handleLogout = () => {
    playSound('click');
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a120a]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  if (!evidence) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a120a]">
      <div className="text-red-900 font-display font-black uppercase tracking-[0.4em]">CRITICAL_ERROR: DATA_CORRUPT</div>
    </div>
  );

  const metadata = typeof evidence.metadata === 'string'
    ? JSON.parse(evidence.metadata)
    : (evidence.metadata || {});

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none" style={{ fontFamily: "'Georgia', serif", background: '#140e06' }}>
      
      {/* ═══════════ TOP CHROME (HUD) ═══════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 h-14 z-50"
        style={{
          background: 'linear-gradient(to bottom, #4a3820, #3a2a12)',
          borderBottom: '3px solid #6a5020',
          boxShadow: '0 3px 16px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => { playSound('click'); navigate(-1); }}
            className="flex items-center gap-2 px-3 py-1.5 transition-all hover:bg-white/5 rounded group"
          >
            <ChevronLeft className="w-5 h-5 text-[#f0d070] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider text-[#f0d070]">Return</span>
          </button>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black uppercase tracking-widest text-[#f0d070]" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              TECH DETECTIVE
            </span>
            <span className="text-xs font-mono tracking-widest ml-1.5 self-center text-[#c8a050]/60">
              OBJECTIVE_FILE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right leading-none">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-0.5 text-[#c8a050]/60">{rankTitle}</div>
            <div className="text-sm font-black text-[#f0d070]">{team?.name || 'Agent'}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#c8a050]/60">XP {xp}</span>
            <div className="w-28 h-3 bg-[#1a0e04] border border-[#5a4010] rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                className="h-full rounded-sm bg-gradient-to-right from-[#a07020] to-[#f0d070]"
                style={{ background: 'linear-gradient(to right, #a07020, #f0d070)' }}
              />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="font-black uppercase text-xs px-4 py-2 transition-all hover:brightness-125 bg-gradient-to-bottom from-[#8B1A1A] to-[#6a0e0e] text-[#ffd0d0] border border-[#5a0808]"
            style={{ letterSpacing: '0.15em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0e0a0 0%, #e4d080 50%, #d8c060 100%)' }}>
        
        <div className="w-full max-w-5xl h-full flex flex-col overflow-hidden bg-[#e8d8a0] border-2 border-[#a07830] shadow-2xl relative">
          
          {/* Document Header */}
          <div className="flex-shrink-0 px-8 py-5 border-b border-[#a07830]/30 flex items-center justify-between bg-black/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#a07830]/10 border border-[#a07830]/40 flex items-center justify-center">
                <Database className="w-6 h-6 text-[#1a0e04]/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#1a0e04]/40 uppercase tracking-widest">Bureau_Ref: {evidence.id}</span>
                <h2 className="text-2xl font-black text-[#1a0e04] uppercase tracking-tight leading-none" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                  {evidence.title.replace(/ /g, '_')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 border-2 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 ${copied ? 'bg-green-100 border-green-800 text-green-800' : 'bg-[#1a0e04]/5 border-[#1a0e04]/10 text-[#1a0e04]/60 hover:bg-[#1a0e04]/10'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy_Data'}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border-2 bg-[#1a0e04]/5 border-[#1a0e04]/10 text-[#1a0e04]/60 hover:bg-[#1a0e04]/10 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download_Binary
              </button>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="flex-shrink-0 px-8 py-3 flex items-center gap-10 bg-black/5 border-b border-[#a07830]/20">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-[#1a0e04]/40" />
              <span className="text-[10px] font-black text-[#1a0e04]/50 uppercase tracking-widest">{evidence.type}_RECON_DATA</span>
            </div>
            <div className="w-[1.5px] h-4 bg-[#1a0e04]/10" />
            <div className="flex items-center gap-6 overflow-hidden">
               {Object.entries(metadata).map(([key, value]) => {
                 if (['linkedPuzzles', 'linkedEvidence'].includes(key)) return null;
                 return (
                   <div key={key} className="flex flex-col">
                     <span className="text-[8px] font-black text-[#1a0e04]/30 uppercase tracking-widest mb-0.5">{key}</span>
                     <span className="text-[10px] font-mono text-[#1a0e04]/70 uppercase tracking-tighter truncate max-w-[120px]">{String(value)}</span>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Document Content Area */}
          <div className="flex-1 overflow-y-auto p-1 px-0 relative custom-scrollbar bg-white/40">
            
            {/* Encryption Overlay */}
            {encryptAction && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-8 backdrop-blur-[2px] bg-black/10">
                <div className="w-full max-w-sm bg-[#e8d8a0] border-4 border-red-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-10 text-center">
                  <LockIcon className="w-16 h-16 text-red-900 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-xl font-black text-red-900 uppercase tracking-[0.2em] mb-4">CRITICAL: DATA_ENCRYPTED</h3>
                  <p className="text-xs font-mono text-[#1a0e04]/70 mb-8 leading-relaxed">
                    The adversary has deployed a crypter on this node. Field analysts must bypass the firewall to proceed.
                  </p>
                  <button
                    onClick={handleDeIce}
                    disabled={resolving}
                    className="w-full py-4 bg-red-900 text-[#f5e6e6] font-black uppercase tracking-[0.25em] text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {resolving ? <Cpu className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                    DE-ICE_NODE (-{encryptAction.metadata?.cost_to_resolve || 25}_XP)
                  </button>
                </div>
              </div>
            )}

            <div className="p-8">
              <LineNumberedContent content={evidence.content} type={evidence.type} isEncrypted={!!encryptAction} />
            </div>
          </div>

          {/* Document Footer */}
          <div className="flex-shrink-0 px-8 py-4 bg-black/5 border-t border-[#a07830]/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-800 animate-pulse" />
                 <span className="text-[10px] font-black text-[#1a0e04]/40 uppercase tracking-widest">Link_Status: Secure</span>
               </div>
               <div className="w-1.5 h-1.5 rounded-full bg-[#1a0e04]/10" />
               <span className="text-[10px] font-black text-[#1a0e04]/30 uppercase tracking-widest">Protocol: SSL_256_FIPS</span>
            </div>
            <div className="font-mono text-[10px] text-[#1a0e04]/20 uppercase tracking-widest font-bold">
               Ref_Node_0x{evidence.case_id.toString(16).toUpperCase()} // Bureau_Data_Stream
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
