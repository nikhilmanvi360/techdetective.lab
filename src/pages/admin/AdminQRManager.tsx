import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { QrCode, Play, Square, RotateCcw, Users, CheckCircle, FileText, Printer, Search, Shield, Zap, Plus } from 'lucide-react';

interface EvidenceCode {
  id: number;
  code: string;
  title: string;
  category: string;
  points_value: number;
  claimed_by_team_id: number | null;
  claimed_at: string | null;
  is_active: boolean;
  claimer_name?: string;
}

interface RoundState {
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
  remaining: number;
  total: number;
}

export default function AdminQRManager() {
  const [codes, setCodes] = useState<EvidenceCode[]>([]);
  const [state, setState] = useState<RoundState | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [codesRes, stateRes] = await Promise.all([
        fetch('/api/admin/r1/codes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/r1/status', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (codesRes.ok && stateRes.ok) {
        setCodes(await codesRes.json());
        setState(await stateRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleRound = async () => {
    if (!state) return;
    const action = state.is_active ? 'stop' : 'start';
    try {
      const res = await fetch('/api/admin/r1/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to toggle round');
    }
  };

  const resetClaims = async () => {
    if (!confirm('Are you sure you want to reset all evidence claims?')) return;
    try {
      const res = await fetch('/api/admin/r1/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Reset failed');
    }
  };

  const printQRs = () => {
    window.print();
  };

  const filteredCodes = codes.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-[#d4a017] font-mono animate-pulse uppercase tracking-[0.4em]">Initializing Evidence Vault...</div>;

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// FIELD_DEPLOYMENT_CONSOLE</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Evidence <span className="text-[#d4a017]">Registry</span>
          </h1>
        </div>
      </div>

      {/* Admin Controls - High Fidelity Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 rounded-sm bg-[#140e06] border-2 border-[#3a2810] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }} />
          
          <div className="relative z-10">
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
               <div className="w-1 h-1 bg-[#d4a017]" /> Live Operation
            </div>
            <h2 className="text-3xl font-display font-black text-[#f4e6c4] uppercase tracking-tight mb-4">The Living Crime Scene</h2>
            <div className="flex items-center gap-6">
              <div className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest border-2 ${state?.is_active ? 'bg-[#d4a017]/10 text-[#f0d070] border-[#d4a017]/40 shadow-[0_0_15px_rgba(212,160,23,0.2)]' : 'bg-red-900/10 text-red-500 border-red-900/40'}`}>
                {state?.is_active ? '● TRANSMITTING' : '○ ENCRYPTED / OFFLINE'}
              </div>
              <div className="text-xs font-mono font-black text-[#a07830] uppercase tracking-widest">
                {state?.total ? `${state.total - state.remaining} / ${state.total} PIECES SECURED` : '0 / 0 PIECES'}
              </div>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <button
              onClick={toggleRound}
              className={`flex items-center gap-3 px-8 py-4 rounded-sm font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${state?.is_active ? 'bg-[#8B2020] text-white hover:bg-red-700' : 'bg-[#d4a017] text-black hover:bg-[#f0d070]'}`}
            >
              {state?.is_active ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {state?.is_active ? 'Abort Operation' : 'Initiate Round'}
            </button>
            <button
              onClick={resetClaims}
              className="p-4 rounded-sm bg-[#2a1a0a] text-[#a07830] border-2 border-[#3a2810] hover:text-[#d4a017] hover:border-[#d4a017]/40 transition-all shadow-lg group/reset"
              title="Reset Vault"
            >
              <RotateCcw className="w-5 h-5 group-hover/reset:rotate-[-45deg] transition-transform" />
            </button>
          </div>
        </div>

        <div className="rounded-sm bg-gradient-to-br from-[#d4a017] to-[#8B6914] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
          
          <div className="relative z-10">
            <div className="text-[10px] font-black text-black/60 uppercase tracking-[0.4em] mb-2">Physical Logistics</div>
            <h3 className="text-2xl font-display font-black text-black uppercase tracking-tight">Print Dispatch</h3>
            <p className="text-xs font-black text-black/70 mt-4 leading-relaxed uppercase tracking-wider">Generate high-fidelity evidence cards for deployment in the field.</p>
          </div>
          
          <button
            onClick={printQRs}
            className="mt-8 relative z-10 flex items-center justify-center gap-3 w-full py-4 bg-black text-[#d4a017] rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-black/90 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Print Field Cards
          </button>
        </div>
      </div>

      {/* NEW: Evidence Creation Section */}
      <div className="rounded-sm bg-[#140e06] border-2 border-[#3a2810] p-10 relative overflow-hidden shadow-2xl">
         <div className="flex items-center gap-4 border-b-2 border-[#3a2810] pb-4 mb-8">
            <Plus className="w-5 h-5 text-[#d4a017]" />
            <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Mint New Field Evidence</h2>
         </div>

         <form onSubmit={async (e) => {
           e.preventDefault();
           const fd = new FormData(e.currentTarget);
           const res = await fetch('/api/admin/r1/codes', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
             body: JSON.stringify(Object.fromEntries(fd))
           });
           if (res.ok) {
             fetchData();
             (e.target as HTMLFormElement).reset();
           }
         }} className="grid grid-cols-1 md:grid-cols-3 gap-8 font-mono">
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Protocol Code</label>
                 <input required name="code" type="text" placeholder="EC-XXXX" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f0d070] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Evidence Type</label>
                 <select name="category" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none">
                    <option value="clue">Key Clue</option>
                    <option value="witness">Witness Statement</option>
                    <option value="document">Redacted Document</option>
                    <option value="red_herring">Red Herring</option>
                 </select>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Document Title</label>
                 <input required name="title" type="text" placeholder="FILE DESIGNATION..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#f4e6c4] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">XP Reward</label>
                    <input required name="points_value" type="number" defaultValue="100" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#d4a017] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Delay (S)</label>
                    <input required name="reveal_delay_seconds" type="number" defaultValue="3" className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#a07830] font-black text-xs focus:border-[#d4a017]/40 outline-none" />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">Redacted Content</label>
                 <textarea required name="content" rows={4} placeholder="CLASSIFIED TELEMETRY..." className="w-full bg-[#0c0803] border-2 border-[#3a2810] p-4 text-[#a07830] font-black uppercase text-xs focus:border-[#d4a017]/40 outline-none placeholder:text-[#a07830]/20" />
              </div>
              <button type="submit" className="w-full bg-[#d4a017] text-black font-black py-4 border-2 border-[#f0d070] hover:bg-[#f0d070] transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Mint Field Card
              </button>
            </div>
         </form>
      </div>

      {/* Code Inventory - Table Style from Main Web */}
      <div className="rounded-sm bg-[#140e06] border-2 border-[#3a2810] overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b-2 border-[#3a2810] bg-[#0c0803] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <FileText className="w-4 h-4 text-[#d4a017]" />
             <h3 className="text-[11px] font-black text-[#f4e6c4] uppercase tracking-[0.4em]">Evidence Repository</h3>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a07830]" />
            <input
              type="text"
              placeholder="FILTER BY CODE OR TITLE..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/60 border-2 border-[#3a2810] rounded-sm text-[10px] font-mono font-black text-[#f0d070] focus:outline-none focus:border-[#d4a017]/50 placeholder:text-[#a07830]/30 tracking-widest uppercase"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0c0803]/80 border-b border-[#3a2810]">
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Registry ID</th>
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Evidence Title</th>
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest text-center">Category</th>
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest text-center">XP Value</th>
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Current Status</th>
                <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest text-right">QR Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a2810]/50">
              {filteredCodes.map(c => (
                <tr key={c.id} className="hover:bg-[#d4a017]/5 transition-all group border-b border-[#3a2810]/20">
                  <td className="p-6">
                     <span className="font-mono text-[#d4a017] font-black tracking-widest text-sm bg-[#d4a017]/5 px-3 py-1 rounded border border-[#d4a017]/10">{c.code}</span>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-black text-[#f4e6c4] uppercase tracking-tight group-hover:text-[#f0d070] transition-colors">{c.title}</div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase border-2 tracking-widest ${
                      c.category === 'clue' ? 'bg-blue-900/10 text-blue-400 border-blue-900/40' :
                      c.category === 'witness' ? 'bg-amber-900/10 text-[#f0d070] border-amber-900/40' :
                      c.category === 'document' ? 'bg-green-900/10 text-green-400 border-green-900/40' :
                      'bg-red-900/10 text-red-400 border-red-900/40'
                    }`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <div className="font-mono text-[#a07830] font-black tracking-widest text-sm group-hover:text-[#d4a017] transition-colors">
                       {c.points_value}
                    </div>
                  </td>
                  <td className="p-6">
                    {c.claimed_by_team_id ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">{c.claimer_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-30">
                        <Zap className="w-3 h-3 text-[#a07830]" />
                        <span className="text-[10px] font-black text-[#a07830] uppercase tracking-widest italic">In Field</span>
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="inline-block p-1 bg-white rounded-sm opacity-20 group-hover:opacity-100 transition-all transform group-hover:scale-125 duration-300 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                      <QRCodeSVG value={`${window.location.origin}/scan?code=${c.code}`} size={36} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-[#0c0803] border-t-2 border-[#3a2810] flex items-center justify-between text-[8px] font-black text-[#a07830]/40 uppercase tracking-[0.3em] font-mono">
           <span>Registry Sync: Active</span>
           <span>Vault Index: {filteredCodes.length} Items</span>
        </div>
      </div>

      {/* Hidden Print Section - Optimized for High Fidelity Printing */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] p-12 overflow-auto text-black">
        <div className="text-center mb-12">
           <div className="text-sm font-black uppercase tracking-[0.5em] mb-4">Central Control Unit // Field Registry</div>
           <h1 className="text-5xl font-black uppercase mb-4 tracking-tighter">Round 1: Evidence Cards</h1>
           <div className="h-2 w-32 bg-black mx-auto" />
        </div>
        
        <div className="grid grid-cols-2 gap-12">
          {codes.map(c => (
            <div key={c.id} className="border-[12px] border-black p-10 flex flex-col items-center justify-between h-[550px] break-inside-avoid relative">
              <div className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest">ID: {c.code}</div>
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest">CAT: {c.category}</div>
              
              <div className="text-center mt-4">
                <div className="text-[12px] font-black uppercase tracking-[0.5em] mb-2 opacity-60">Tech Detective Bureau</div>
                <div className="text-3xl font-black uppercase mb-4 tracking-tight">Evidence Secure</div>
                <div className="h-1 w-16 bg-black mx-auto" />
              </div>
              
              <div className="p-6 bg-white border-4 border-black shadow-[10px_10px_0_rgba(0,0,0,1)]">
                <QRCodeSVG value={`${window.location.origin}/scan?code=${c.code}`} size={220} />
              </div>
              
              <div className="text-center w-full mb-4">
                <div className="text-xl font-mono font-black tracking-[0.4em] mb-4 bg-black text-white py-2">{c.code}</div>
                <div className="text-[11px] uppercase font-black text-black leading-relaxed tracking-widest">
                  Scan this code to secure evidence for your unit.<br />
                  First team to verify claims the XP bounty.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
}
