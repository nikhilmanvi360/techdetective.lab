import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, FileSearch, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';
import { getRankTitle } from '../utils/ranks';

// ── Difficulty config ─────────────────────────────────────────────────────────
function diffCfg(d: string) {
  if (d === 'Easy')         return { label: 'EASY',         pill: '#3d6128', pillText: '#88cc55', glow: 'rgba(88,178,55,0.55)'  };
  if (d === 'Intermediate') return { label: 'INTERMEDIATE', pill: '#7a4a08', pillText: '#f0a030', glow: 'rgba(240,160,48,0.55)'  };
  if (d === 'Hard')         return { label: 'HARD',         pill: '#6a1818', pillText: '#e86050', glow: 'rgba(232,80,60,0.55)'   };
  return                           { label: 'EXPERT',       pill: '#3d145a', pillText: '#c060d0', glow: 'rgba(192,80,208,0.55)'  };
}

// ── Nav row ───────────────────────────────────────────────────────────────────
function NavRow({ to, label, sub, svgIcon, delay = 0 }: {
  to: string; label: string; sub: string; svgIcon: React.ReactNode; delay?: number;
}) {
  const { playSound } = useSound();
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} onClick={() => playSound('click')}>
      <motion.div
        initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        className="flex items-stretch border-b cursor-pointer"
        style={{
          borderColor: 'rgba(100,70,20,0.3)',
          background: hov ? 'rgba(200,160,60,0.07)' : 'transparent',
          transition: 'background 0.18s',
        }}
      >
        {/* Icon thumbnail — mimics the photo thumbnails in the reference */}
        <div className="w-[58px] flex-shrink-0 flex items-center justify-center border-r"
          style={{ borderColor: 'rgba(100,70,20,0.3)', background: 'rgba(0,0,0,0.35)', minHeight: '56px' }}>
          {svgIcon}
        </div>
        {/* Text */}
        <div className="flex-1 px-3 py-3">
          <div className="text-sm font-black uppercase tracking-wide leading-tight" style={{ color: '#d4a017', fontFamily: "'Georgia', serif" }}>{label}</div>
          <div className="text-[10px] font-mono mt-0.5 leading-tight" style={{ color: 'rgba(180,140,50,0.55)' }}>{sub}</div>
        </div>
        <div className="flex items-center pr-3">
          <ChevronRight className="w-4 h-4" style={{ color: hov ? '#d4a017' : 'rgba(200,160,50,0.3)' }} />
        </div>
      </motion.div>
    </Link>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Case | null>(null);
  const { playSound } = useSound();
  const navigate = useNavigate();
  const team = JSON.parse(localStorage.getItem('team') || '{}');
  const isAdmin = team?.role === 'admin' || team?.name === 'CCU_ADMIN';
  const rank = getRankTitle(team?.score ?? 0);

  useEffect(() => {
    fetch('/api/cases', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => { if (r.status === 401 || r.status === 403) { localStorage.clear(); window.location.href = '/login'; return null; } return r.json(); })
      .then(d => { if (Array.isArray(d)) setCases(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111a0e' }}>
      <p className="uppercase tracking-[0.4em] text-sm animate-pulse" style={{ color: '#c8a050', fontFamily: "'Georgia', serif" }}>Retrieving Case Files...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex select-none"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        // Base dark leather-green background
        background: '#151e11',
        backgroundImage: `
          repeating-linear-gradient(45deg,  rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 9px),
          repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 9px),
          radial-gradient(ellipse at 30% 20%, rgba(40,55,20,0.4) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, rgba(20,30,10,0.5) 0%, transparent 50%)
        `,
      }}
    >

      {/* ══════════════════ LEFT MAIN PANEL ══════════════════ */}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* ── Logo Row + Scope + Magnifier decoration ── */}
        <div className="relative px-8 pt-6 pb-3 flex items-start">
          {/* TECHDETECTIVE Logo */}
          <div>
            <h1 className="text-[52px] font-black uppercase leading-none tracking-wide"
              style={{
                color: '#e8d09a',
                textShadow: '0 3px 10px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)',
                fontFamily: "'Georgia', serif",
                letterSpacing: '0.07em',
              }}>
              TECHDETECTIVE
            </h1>
            <div className="text-xs font-mono tracking-[0.5em] mt-0.5" style={{ color: 'rgba(200,160,80,0.5)' }}>
              CCU-V4.0
            </div>
          </div>

          {/* Scope — CSS art, top center-right */}
          <div className="absolute top-2 right-56 pointer-events-none">
            {/* Scope cylinder body */}
            <div className="relative flex flex-col items-center">
              {/* Top cap */}
              <div style={{ width: 56, height: 12, background: 'linear-gradient(to bottom, #5a3f1e, #3a2510)', borderRadius: '4px 4px 0 0', border: '1px solid #7a5530', boxShadow: '0 -2px 4px rgba(0,0,0,0.6)' }} />
              {/* Main lens housing */}
              <div className="relative flex items-center justify-center" style={{ width: 86, height: 86, background: 'radial-gradient(circle at 38% 32%, #6a4a24, #3a2510, #1a0e04)', borderRadius: '6px', border: '2px solid #6a4520', boxShadow: '0 4px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                {/* Outer lens ring */}
                <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #4a5a6a, #1a2030, #08100a)', border: '3px solid #4a3820', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9), 0 0 0 1px #2a3040' }}>
                  {/* Inner dark lens */}
                  <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle at 40% 35%, #1a2520, #050a06)', border: '1px solid rgba(100,130,80,0.2)' }}>
                    {/* Crosshair */}
                    <div className="relative w-10 h-10">
                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(100,180,100,0.5)', marginTop: '-0.5px' }} />
                      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(100,180,100,0.5)', marginLeft: '-0.5px' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(100,180,100,0.6)' }} />
                    </div>
                  </div>
                </div>
                {/* Side knob */}
                <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 10, height: 20, background: 'linear-gradient(to right, #5a3a18, #3a2010)', borderRadius: '0 3px 3px 0', border: '1px solid #7a5030' }} />
                {/* Rivets */}
                {[[-3,10],[-3,76],[83,10],[83,76]].map(([x,y],k) => (
                  <div key={k} style={{ position: 'absolute', left: x, top: y, width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #c8a050, #6a4010)', border: '1px solid #8a6020', boxShadow: '0 1px 2px rgba(0,0,0,0.8)' }} />
                ))}
              </div>
              {/* Mount arm */}
              <div style={{ width: 4, height: 20, background: 'linear-gradient(to right, #5a3a18, #3a2010)', border: '1px solid #7a5030' }} />
            </div>
          </div>

          {/* Magnifying glass decoration — below scope */}
          <div className="absolute right-32 top-16 pointer-events-none" style={{ transform: 'rotate(-25deg)' }}>
            <div className="relative flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(200,200,220,0.12), rgba(50,60,40,0.5))', border: '5px solid #6a4a20', boxShadow: '0 3px 10px rgba(0,0,0,0.7)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(200,200,220,0.15)', background: 'rgba(150,180,150,0.05)' }} />
            </div>
            {/* Handle */}
            <div style={{ position: 'absolute', bottom: -22, right: 4, width: 8, height: 26, background: 'linear-gradient(to bottom, #6a4a20, #3a2810)', borderRadius: '0 0 4px 4px', border: '1px solid #8a6030', transform: 'rotate(5deg)' }} />
          </div>
        </div>

        {/* ── Amber breadcrumb bar ── */}
        <div className="mx-8 my-2 flex items-center gap-2 px-3 py-2 border-y"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
            borderColor: 'rgba(180,140,40,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(200,160,80,0.08)',
          }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a050', boxShadow: '0 0 4px rgba(200,160,80,0.6)' }} />
          <span className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: 'rgba(180,145,55,0.8)' }}>
            ACTIVE CASE ARCHIVE // THE BEHAVIORAL ANALYSIS UNIT — {new Date().getFullYear()}
          </span>
          <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: '#c8a050', boxShadow: '0 0 4px rgba(200,160,80,0.6)' }} />
        </div>

        {/* ── SELECT MISSION heading ── */}
        <div className="px-8 pb-2">
          <h2 className="text-[52px] font-black uppercase leading-tight"
            style={{ color: '#d4a017', textShadow: '0 2px 16px rgba(0,0,0,0.8), 0 0 40px rgba(180,130,10,0.2)', letterSpacing: '0.03em' }}>
            SELECT MISSION
          </h2>
          <p className="text-[11px] font-mono -mt-1" style={{ color: 'rgba(180,150,70,0.55)' }}>
            {cases.length} active investigations found. Choose your target.
          </p>
        </div>

        {/* ── Case cards ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-2.5 pt-2">
          {cases.length === 0 && (
            <div className="flex flex-col items-center justify-center h-52 border border-dashed text-center" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
              <FileSearch className="w-10 h-10 mb-3" style={{ color: 'rgba(200,160,80,0.2)' }} />
              <p className="uppercase tracking-widest text-sm" style={{ color: 'rgba(200,160,80,0.4)' }}>No Active Cases</p>
              {isAdmin && <Link to="/admin/builder" className="mt-4 text-[11px] uppercase tracking-widest px-4 py-2 border" style={{ color: '#d4a017', borderColor: 'rgba(200,160,80,0.35)' }}>→ Open Case Builder</Link>}
            </div>
          )}

          {cases.map((c, i) => {
            const dc = diffCfg(c.difficulty);
            const isSel = selected?.id === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 220, damping: 24 }}
                onMouseEnter={() => { playSound('click'); setSelected(c); }}
                onMouseLeave={() => setSelected(null)}
                onClick={() => { playSound('ping'); navigate(`/case/${c.id}`); }}
                className="relative cursor-pointer"
                style={{
                  // Outer dark leather frame
                  background: 'linear-gradient(135deg, #3a2810 0%, #2a1c0a 50%, #3a2810 100%)',
                  borderRadius: '5px',
                  padding: '3px',
                  boxShadow: isSel
                    ? `0 0 0 2px ${dc.pill}, 0 0 18px ${dc.glow}, 0 8px 24px rgba(0,0,0,0.7)`
                    : '0 4px 14px rgba(0,0,0,0.6), 0 0 0 1px rgba(100,70,20,0.4)',
                  transform: isSel ? 'translateX(6px)' : 'none',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <div className="flex items-stretch overflow-hidden" style={{ borderRadius: '3px' }}>

                  {/* Case number — dark leather tab */}
                  <div className="w-16 flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(to bottom, #2a1c0a, #1a1008, #2a1c0a)',
                      borderRight: `2px solid ${isSel ? dc.pill : 'rgba(80,50,15,0.6)'}`,
                      minHeight: '90px',
                    }}>
                    <span className="text-3xl font-black tabular-nums"
                      style={{ color: isSel ? dc.pillText : 'rgba(140,100,40,0.55)', fontFamily: "'Georgia', serif", transition: 'color 0.2s' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Parchment body with LEDGER LINES */}
                  <div className="flex-1 px-5 py-4 relative"
                    style={{
                      // Layered: repeating ruled lines ON TOP of parchment gradient
                      backgroundImage: `
                        repeating-linear-gradient(
                          0deg,
                          transparent 0px,
                          transparent 23px,
                          rgba(90,55,15,0.13) 23px,
                          rgba(90,55,15,0.13) 24px
                        ),
                        linear-gradient(
                          170deg,
                          #e2c07c 0%,
                          #d4ae68 35%,
                          #c8a050 65%,
                          #c0983a 100%
                        )
                      `,
                      backgroundSize: 'auto',
                    }}>
                    {/* Top-left faint margin line (like real ledger paper) */}
                    <div className="absolute left-12 top-0 bottom-0 w-px" style={{ background: 'rgba(160,90,30,0.18)' }} />

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-widest"
                        style={{ background: dc.pill, color: dc.pillText, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                        {dc.label}
                      </span>
                      <span className="text-[9px] font-mono font-bold" style={{ color: 'rgba(50,28,6,0.55)' }}>
                        CASE_NODE_{String(i + 1).padStart(3, '0')}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-black uppercase leading-tight tracking-wide" style={{ color: '#1a0e04', textShadow: '0 1px 0 rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
                      {c.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] font-mono mt-2 line-clamp-2 leading-relaxed" style={{ color: 'rgba(40,22,5,0.65)' }}>
                      {c.description}
                    </p>
                  </div>

                  {/* XP badge — dark inset box */}
                  <div className="w-[60px] flex-shrink-0 flex flex-col items-center justify-center"
                    style={{
                      background: isSel
                        ? `linear-gradient(to bottom, ${dc.pill}cc, #1a0e02)`
                        : 'linear-gradient(to bottom, #2a1c0a, #1a1006)',
                      borderLeft: `2px solid ${isSel ? dc.pill : 'rgba(80,50,15,0.55)'}`,
                      boxShadow: isSel ? `inset 0 0 12px ${dc.glow}` : 'none',
                      transition: 'all 0.2s',
                    }}>
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color: isSel ? dc.pillText : '#b88040', fontFamily: "'Georgia', serif" }}>
                      +{c.points_on_solve ?? 0}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: isSel ? dc.pillText : '#7a5020' }}>
                      XP
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div className="w-[270px] flex-shrink-0 flex flex-col border-l"
        style={{
          background: 'linear-gradient(to bottom, #0d180a, #0a1208)',
          borderColor: 'rgba(100,70,20,0.35)',
        }}>

        {/* Player HUD */}
        <div className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ background: 'rgba(0,0,0,0.55)', borderColor: 'rgba(100,70,20,0.4)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-mono uppercase tracking-widest leading-tight" style={{ color: 'rgba(200,160,80,0.45)' }}>{rank}</div>
            <div className="text-[12px] font-black uppercase leading-tight" style={{ color: '#d4a017', fontFamily: "'Georgia', serif" }}>{team?.name || 'OPERATIVE'}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center border px-2 py-1"
              style={{ borderColor: 'rgba(200,160,80,0.3)', background: 'rgba(200,160,80,0.08)' }}>
              <div className="text-[7px] font-mono uppercase" style={{ color: 'rgba(200,160,80,0.5)' }}>XP</div>
              <div className="text-sm font-black tabular-nums leading-tight" style={{ color: '#f5e6c8' }}>{team?.score ?? 55}</div>
            </div>
            <button
              onClick={() => { localStorage.clear(); navigate('/login'); }}
              className="text-[8px] font-black uppercase px-2 py-1.5 tracking-widest"
              style={{ color: '#e05050', border: '1px solid rgba(184,60,60,0.5)', background: 'rgba(100,20,20,0.3)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
            >
              [DISCONNECT]
            </button>
          </div>
        </div>

        {/* Crosshair / preview */}
        <div className="flex flex-col items-center justify-center border-b py-6 px-4 text-center"
          style={{ borderColor: 'rgba(100,70,20,0.25)', minHeight: '130px' }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full">
                <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(200,160,80,0.4)' }}>CASE PREVIEW</div>
                <div className="text-[12px] font-black uppercase leading-snug mb-2" style={{ color: '#f5e6c8', letterSpacing: '0.04em' }}>
                  {selected.title}
                </div>
                <p className="text-[10px] font-mono leading-relaxed line-clamp-3 mb-3" style={{ color: 'rgba(200,160,80,0.55)' }}>
                  {selected.description}
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { playSound('ping'); navigate(`/case/${selected.id}`); }}
                  className="w-full py-2 text-[11px] font-black uppercase tracking-[0.25em] border-2"
                  style={{
                    background: `linear-gradient(to bottom, ${diffCfg(selected.difficulty).pill}dd, ${diffCfg(selected.difficulty).pill}80)`,
                    borderColor: diffCfg(selected.difficulty).pill,
                    color: diffCfg(selected.difficulty).pillText,
                    boxShadow: `0 0 12px ${diffCfg(selected.difficulty).glow}`,
                  }}
                >
                  OPEN CASE →
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Crosshair className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(200,160,80,0.18)' }} />
                <p className="text-[9px] font-mono uppercase tracking-widest leading-relaxed" style={{ color: 'rgba(200,160,80,0.35)' }}>
                  FOCUS ON A CASE FOR<br />ENHANCED PREVIEW
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Command Hub label */}
        <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(100,70,20,0.2)' }}>
          <span className="text-[9px] font-mono uppercase tracking-[0.45em]" style={{ color: 'rgba(200,160,80,0.4)' }}>// COMMAND HUB</span>
        </div>

        {/* Nav rows */}
        <div className="flex-1">
          <NavRow to="/scoreboard" label="RANKINGS" sub="Global leaderboard & intelligence" delay={0.1}
            svgIcon={
              <svg viewBox="0 0 32 38" width="32" height="38" fill="#c8a050">
                {/* Stylized eagle/trophy */}
                <ellipse cx="16" cy="8" rx="6" ry="7" fill="#a07830" />
                <path d="M6 6 Q2 10 4 14 Q8 13 10 11Z" />
                <path d="M26 6 Q30 10 28 14 Q24 13 22 11Z" />
                <path d="M10 14 Q8 20 12 22 L16 24 L20 22 Q24 20 22 14Z" fill="#b89040" />
                <rect x="12" y="24" width="8" height="3" fill="#8a6020" />
                <rect x="8" y="27" width="16" height="2" rx="1" fill="#6a4010" />
              </svg>
            }
          />
          <NavRow to="/profile" label="OPERATIVE FILE" sub="Your stats, badges & history" delay={0.15}
            svgIcon={
              <svg viewBox="0 0 32 40" width="32" height="40" fill="#c8a050">
                {/* Classical bust */}
                <ellipse cx="16" cy="12" rx="7" ry="9" fill="#b89048" />
                <path d="M6 28 Q6 22 16 22 Q26 22 26 28 L26 32 Q16 30 6 32Z" fill="#a07830" />
                <rect x="10" y="30" width="12" height="3" fill="#8a6020" />
                <rect x="7" y="33" width="18" height="2" rx="1" fill="#6a4010" />
                <ellipse cx="14" cy="10" rx="2" ry="1.5" fill="#8a6020" />
                <ellipse cx="18" cy="10" rx="2" ry="1.5" fill="#8a6020" />
              </svg>
            }
          />
          <NavRow to="/black-market" label="SHADOW MARKET" sub="Black market hint exchange" delay={0.2}
            svgIcon={
              <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#c8a050" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="10" cy="13" r="6" />
                <line x1="16" y1="13" x2="28" y2="13" />
                <line x1="25" y1="13" x2="25" y2="18" />
                <line x1="28" y1="13" x2="28" y2="16" />
                <circle cx="10" cy="13" r="2" fill="#8a6030" />
              </svg>
            }
          />
          {isAdmin && (
            <NavRow to="/admin" label="COMMAND CENTER" sub="Admin panel & event control" delay={0.25}
              svgIcon={
                <svg viewBox="0 0 32 36" width="32" height="36">
                  <path d="M16 2 L28 8 L28 18 C28 27 22 33 16 35 C10 33 4 27 4 18 L4 8 Z" fill="#1e3a1e" stroke="#5a8a3c" strokeWidth="1.5" />
                  <path d="M11 18 L14 21 L21 14" stroke="#88cc55" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          )}
        </div>

        {/* Bottom section with desk image (coffee + character) */}
        <div className="border-t relative overflow-hidden flex-shrink-0"
          style={{ borderColor: 'rgba(100,70,20,0.3)', height: '120px' }}>
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/detective_desk_bg.png')", filter: 'brightness(0.45) saturate(0.6)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,6,0.85), rgba(8,12,6,0.3))' }} />
          {/* Status */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#5a8a3c', boxShadow: '0 0 4px rgba(90,138,60,0.8)' }} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#5a8a3c' }}>
                SYSTEM STATUS: OPERATIONAL
              </span>
            </div>
            <div className="text-[8px] font-mono" style={{ color: 'rgba(180,140,50,0.35)' }}>
              ⌥ CCU DIGITAL CRIME LAB V4.0 — EST. {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
