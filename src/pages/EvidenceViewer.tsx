import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Terminal, Download, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Evidence } from '../types';

export default function EvidenceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch evidence');
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [id]);

  const handleCopy = () => {
    if (evidence) {
      navigator.clipboard.writeText(evidence.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="animate-pulse font-mono text-terminal-green">DECRYPTING_EVIDENCE...</div>;
  if (!evidence) return <div className="text-red-500 font-mono">EVIDENCE_NOT_FOUND</div>;

  const metadata = evidence.metadata ? JSON.parse(evidence.metadata) : {};

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-terminal-green transition-colors uppercase tracking-widest"
        data-tooltip="Return to Case Overview"
      >
        <ChevronLeft className="w-4 h-4" />
        BACK_TO_CASE
      </button>

      <div className="terminal-card">
        <div className="terminal-header">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-terminal-green" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
              Evidence File: {evidence.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
              data-tooltip="Copy to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-terminal-green" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white" 
              data-tooltip="Download Raw Data"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-1 bg-terminal-line/20">
          <div className="flex flex-col md:flex-row md:items-center gap-4 px-4 py-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-terminal-line/30">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {Object.entries(metadata).map(([key, value]) => {
                if (key === 'linkedPuzzles' || key === 'linkedEvidence') return null;
                return (
                  <div key={key}>
                    <span className="text-gray-600">{key}:</span> {String(value)}
                  </div>
                );
              })}
            </div>
            <div className="shrink-0">
              SIZE: {evidence.content.length} BYTES
            </div>
          </div>
          
          {(metadata.linkedPuzzles?.length > 0 || metadata.linkedEvidence?.length > 0) && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-2 text-[10px] font-mono border-b border-terminal-line/30 bg-black/20">
              <div className="flex items-center gap-1 text-terminal-green">
                <LinkIcon className="w-3 h-3" />
                <span className="uppercase tracking-widest font-bold">Linked Data:</span>
              </div>
              
              {metadata.linkedPuzzles?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 uppercase">Puzzles:</span>
                  {metadata.linkedPuzzles.map((pid: number) => (
                    <Link 
                      key={`p-${pid}`} 
                      to={`/cases/${evidence.case_id}#puzzle-${pid}`}
                      className="px-2 py-0.5 bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20 rounded transition-colors"
                    >
                      #{pid}
                    </Link>
                  ))}
                </div>
              )}

              {metadata.linkedEvidence?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 uppercase">Evidence:</span>
                  {metadata.linkedEvidence.map((eid: number) => (
                    <Link 
                      key={`e-${eid}`} 
                      to={`/evidence/${eid}`}
                      className="px-2 py-0.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                    >
                      #{eid}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 font-mono text-sm overflow-x-auto">
          <motion.pre 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`whitespace-pre-wrap break-all leading-relaxed ${
              evidence.type === 'log' ? 'text-terminal-green' : 
              evidence.type === 'code' ? 'text-yellow-400' : 
              'text-gray-300'
            }`}
          >
            {evidence.content}
          </motion.pre>
        </div>

        <div className="p-4 bg-black/40 border-t border-terminal-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Secure View Active</span>
          </div>
          <span className="text-[10px] font-mono text-gray-700 uppercase tracking-widest">
            Checksum: {Math.random().toString(16).slice(2, 10).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Analysis Tools Sidebar (Optional/Visual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terminal-card p-4 space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Metadata Analysis</h4>
          <div className="space-y-2">
            <div className="h-1 bg-terminal-line rounded-full overflow-hidden">
              <div className="h-full bg-terminal-green w-3/4" />
            </div>
            <p className="text-[10px] font-mono text-gray-600 uppercase">Integrity: 98.4% Verified</p>
          </div>
        </div>
        <div className="terminal-card p-4 space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Pattern Recognition</h4>
          <p className="text-[10px] font-mono text-terminal-green uppercase animate-pulse">Scanning for anomalies...</p>
        </div>
        <div className="terminal-card p-4 space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Expert Notes</h4>
          <p className="text-[10px] font-mono text-gray-500 italic">"Look for inconsistencies in the timestamps."</p>
        </div>
      </div>
    </div>
  );
}
