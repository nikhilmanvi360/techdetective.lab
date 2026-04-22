import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function LandingPage() {
 const navigate = useNavigate();
 const [ready, setReady] = useState(false);
 const [fadeOut, setFadeOut] = useState(false);
 const [blink, setBlink] = useState(true);

 // Delay the"Press any key" prompt slightly for dramatic effect
 useEffect(() => {
 const t = setTimeout(() => setReady(true), 1800);
 return () => clearTimeout(t);
 }, []);

 // Blinking underscore
 useEffect(() => {
 if (!ready) return;
 const interval = setInterval(() => setBlink(b => !b), 700);
 return () => clearInterval(interval);
 }, [ready]);

 const handleEnter = useCallback(() => {
 if (!ready) return;
 setFadeOut(true);
 setTimeout(() => navigate('/login'), 900);
 }, [ready, navigate]);

 useEffect(() => {
 if (!ready) return;
 const handler = (e: KeyboardEvent) => {
 if (e.key !== 'F5' && e.key !== 'Tab') handleEnter();
 };
 window.addEventListener('keydown', handler);
 return () => window.removeEventListener('keydown', handler);
 }, [ready, handleEnter]);

 return (
 <AnimatePresence>
 {!fadeOut && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0, filter: 'brightness(0)' }}
 transition={{ duration: 0.9 }}
 className="fixed inset-0 min-h-screen overflow-hidden cursor-pointer select-none"
 onClick={handleEnter}
 >
 {/* ── Full-screen background image with gentle Ken-Burns zoom ── */}
 <motion.div
 initial={{ scale: 1.0 }}
 animate={{ scale: 1.06 }}
 transition={{ duration: 30, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
 className="absolute inset-0 bg-cover bg-center"
 style={{ backgroundImage: 'url(/assets/Gemini_Generated_Image_f0dy2sf0dy2sf0dy.png)' }}
 />

 {/* ── Dark vignette from all sides ── */}
 <div className="absolute inset-0"
 style={{
 background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 100%)'
 }}
 />
 {/* Bottom fade to black */}
 <div className="absolute inset-x-0 bottom-0 h-40"
 style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
 />
 {/* Top fade */}
 <div className="absolute inset-x-0 top-0 h-32"
 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
 />

 {/* ── Subtle film-grain texture ── */}
 <div
 className="absolute inset-0 opacity-[0.06] pointer-events-none"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
 backgroundRepeat: 'repeat',
 backgroundSize: '200px 200px',
 }}
 />

 {/* ── Top bar: Case classification ── */}
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4, duration: 0.8 }}
 className="absolute top-0 inset-x-0 flex items-center justify-between px-10 py-5"
 >
 <div className="flex items-center gap-3">
 {/* Gold badge pip */}
 <div className="w-8 h-8 rounded-full flex items-center justify-center"
 style={{
 background: 'radial-gradient(circle at 35% 35%, #d4a017, #8B6914)',
 boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
 border: '2px solid #a07830',
 }}
 >
 <span className="text-[7px] font-bold text-amber-100" style={{ fontFamily: 'serif', letterSpacing: '0.05em' }}>CCU</span>
 </div>
 <span className="text-[10px] uppercase tracking-[0.35em] font-semibold"
 style={{ color: '#c8a050', fontFamily:"'Georgia', serif", textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
 >
 K.L.E. Cyber Crimes Unit
 </span>
 </div>
 <span className="text-[9px] uppercase tracking-widest"
 style={{ color: 'rgba(200,160,80,0.6)', fontFamily: 'monospace', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
 >
 CLASSIFIED // LEVEL-5
 </span>
 </motion.div>

 {/* ── Main title block ── */}
 <div className="absolute inset-0 flex flex-col items-start justify-center px-12 md:px-20">
 <motion.div
 initial={{ opacity: 0, x: -30 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.6, duration: 1.0, ease: 'easeOut' }}
 >
 {/* Thin rule + overline */}
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-px" style={{ background: '#c8a050' }} />
 <span className="text-[10px] uppercase tracking-[0.5em] font-medium"
 style={{ color: '#c8a050', fontFamily:"'Georgia', serif", textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
 >
 Case File Active
 </span>
 </div>

 {/* Main headline */}
 <h1
 className="text-5xl md:text-7xl font-bold leading-none mb-2 uppercase"
 style={{
 fontFamily:"'Georgia', 'Times New Roman', serif",
 color: '#f5e6c8',
 textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 60px rgba(200,160,80,0.15)',
 letterSpacing: '0.04em',
 }}
 >
 Tech
 </h1>
 <h1
 className="text-5xl md:text-7xl font-bold leading-none uppercase"
 style={{
 fontFamily:"'Georgia', 'Times New Roman', serif",
 color: '#d4a017',
 textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(212,160,23,0.3)',
 letterSpacing: '0.04em',
 }}
 >
 Detective
 </h1>

 {/* Subtitle line */}
 <div className="flex items-center gap-3 mt-4">
 <div className="w-10 h-px" style={{ background: 'rgba(200,160,80,0.4)' }} />
 <p className="text-xs uppercase tracking-[0.4em]"
 style={{ color: 'rgba(245,230,200,0.6)', fontFamily:"'Georgia', serif" }}
 >
 The Digital Crime Lab • v4.0
 </p>
 </div>
 </motion.div>
 </div>

 {/* ── Pull-quote / description — bottom left ── */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 1.2, duration: 0.8 }}
 className="absolute bottom-24 left-12 md:left-20 max-w-xs"
 >
 <p className="text-sm italic leading-relaxed"
 style={{ color: 'rgba(245,230,200,0.55)', fontFamily:"'Georgia', serif", textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
 >"Every byte of data leaves a trace.<br />Find the ghost in the machine."
 </p>
 </motion.div>

 {/* ── Press any key prompt — bottom center ── */}
 <AnimatePresence>
 {ready && (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.6 }}
 className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2"
 >
 {/* Horizontal rule */}
 <div className="w-24 h-px mx-auto mb-2" style={{ background: 'linear-gradient(to right, transparent, #c8a050, transparent)' }} />
 <p className="text-[11px] uppercase tracking-[0.5em] font-medium"
 style={{
 color: blink ? 'rgba(212,160,23,0.9)' : 'rgba(212,160,23,0.3)',
 fontFamily:"'Georgia', serif",
 transition: 'color 0.15s',
 textShadow: '0 1px 8px rgba(0,0,0,0.9)',
 }}
 >
 Click or Press Any Key to Enter
 </p>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── Corner bracket decorations (subtle, not cyber) ── */}
 {[
 'top-5 left-5 border-t border-l',
 'top-5 right-5 border-t border-r',
 'bottom-5 left-5 border-b border-l',
 'bottom-5 right-5 border-b border-r',
 ].map((cls) => (
 <div
 key={cls}
 className={`absolute w-6 h-6 ${cls}`}
 style={{ borderColor: 'rgba(200,160,80,0.25)' }}
 />
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 );
}
