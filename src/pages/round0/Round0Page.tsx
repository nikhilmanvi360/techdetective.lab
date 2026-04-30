import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Cpu, Code2, AlertTriangle, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';

type Task = 'HTML' | 'CSS' | 'PYTHON' | 'BRIEFING';

export default function Round0Page() {
  const [state, setState] = useState<any>(null);
  const [activeTask, setActiveTask] = useState<Task>('HTML');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pythonOutput, setPythonOutput] = useState('');

  useEffect(() => {
    const socket = io();
    fetchState();

    const team = JSON.parse(localStorage.getItem('team') || '{}');
    socket.on(`team_${team.id}_r0_complete`, () => {
      setRestoring(true);
      setTimeout(() => window.location.href = '/', 3000);
    });

    socket.on(`team_${team.id}_r0_task_update`, (data) => {
        setState(data.state);
    });

    // Syndicate Sabotage Loop
    const glitchInterval = setInterval(() => {
        if (Math.random() > 0.7) {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 800);
        }
    }, 15000);

    // Initialize Pyodide
    const loadPyodide = async () => {
        if (!(window as any).loadPyodide) {
            const script = document.createElement('script');
            script.src = "/pyodide/pyodide.js";
            script.onload = async () => {
                const py = await (window as any).loadPyodide({
                    indexURL: "/pyodide/"
                });
                setPyodide(py);
            };
            document.head.appendChild(script);
        } else {
            const py = await (window as any).loadPyodide({
                indexURL: "/pyodide/"
            });
            setPyodide(py);
        }
    };

    loadPyodide();

    return () => { 
        socket.disconnect(); 
        clearInterval(glitchInterval);
    };
  }, []);

  useEffect(() => {
    if (activeTask === 'HTML' || activeTask === 'CSS') {
        let content = userInput;
        if (activeTask === 'CSS') {
            content = `<style>${userInput}</style><div class="suspect-feed"></div>`;
        }
        setPreviewContent(content);
    }
  }, [userInput, activeTask]);

  const fetchState = async () => {
    const res = await fetch('/api/r0/state', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setState(data);
  };

  const handleSubmit = async () => {
    setError(null);
    setPythonOutput('');

    if (activeTask === 'PYTHON' && pyodide) {
        try {
            // Capture stdout
            pyodide.runPython(`
                import sys
                import io
                sys.stdout = io.StringIO()
            `);
            pyodide.runPython(userInput);
            const output = pyodide.runPython("sys.stdout.getvalue()");
            setPythonOutput(output);
            
            // Validate output
            if (!output.includes('91.4') && !output.includes('91')) {
                setError("Python output does not match expected extraction value.");
                return;
            }
        } catch (e: any) {
            setError(e.message);
            return;
        }
    }

    const res = await fetch('/api/r0/submit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ task: activeTask, answer: userInput })
    });
    
    if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setUserInput('');
        if (activeTask === 'HTML') setActiveTask('CSS');
        else if (activeTask === 'CSS') setActiveTask('PYTHON');
        else if (activeTask === 'PYTHON') setActiveTask('BRIEFING');
    } else {
        const data = await res.json();
        setError(data.message || 'Validation failed.');
    }
  };

  const taskPrompts = {
    HTML: {
        title: "Reconstruct Audit Table",
        desc: "The Meridian Bank audit database has lost its structure. Repair the table structure to render the records.",
        startingCode: "<!-- FIXME: Missing <table> and closing tags -->\n<tr><td>SIMULATION_BATCH_087</td></tr>",
        hint: "Wrap the row in <table> tags to restore the grid."
    },
    CSS: {
        title: "Descramble Security Feed",
        desc: "A jammer has blurred the primary lobby feed. Apply visual mitigation to the stylesheet.",
        startingCode: ".suspect-feed {\n  filter: blur(20px);\n  /* TODO: Set filter to none */\n}",
        hint: "Override the filter property with 'none'."
    },
    PYTHON: {
        title: "Parse 4,247 Log Runs",
        desc: "The raw archive contains 4,247 batch logs. Write a Python script to isolate the runs that exceed 90% success probability.",
        startingCode: "log_data = 'batch_runs=4247, success=91.4'\n# TODO: Extract the success rate and print it if > 90",
        hint: "The system expects a printed string as the final output.",
        fragment: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
    }
  };

  const taskFragments = {
    HTML: "https://images.unsplash.com/photo-1557591953-97d81a967527?auto=format&fit=crop&q=80&w=800",
    CSS: "https://images.unsplash.com/photo-1510511459019-5dee99c48fc8?auto=format&fit=crop&q=80&w=800",
    PYTHON: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
  };

  if (!state) return null;

  return (
    <div className={`min-h-screen bg-[#0a0805] text-[#f4e6c4] font-mono overflow-hidden flex flex-col relative transition-all duration-75 ${glitch ? 'translate-x-1 translate-y-1 skew-x-1 brightness-150' : ''}`}>
      {/* Glitch Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity ${glitch ? 'opacity-40' : 'opacity-[0.03]'}`}>
          <div className="scanline" />
          {glitch && (
              <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
          )}
      </div>

      {/* Header */}
      <header className="h-16 border-b-2 border-[#3a2810] flex items-center justify-between px-8 bg-[#140e06] relative z-20">
          <div className="flex items-center gap-4">
              <div className="p-2 bg-[#d4a017] text-black">
                  <Shield className="w-5 h-5" />
              </div>
              <div>
                  <h1 className="text-xs font-black uppercase tracking-[0.4em]">AUDIT Interface</h1>
                  <p className="text-[8px] text-[#a07830] uppercase tracking-widest mt-0.5">Protocol: The Briefing</p>
              </div>
          </div>
          <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-[#a07830] uppercase tracking-widest mb-1">Restoration Progress</span>
                  <div className="flex gap-1">
                      {(['HTML', 'CSS', 'PYTHON', 'BRIEFING'] as Task[]).map(t => (
                          <div key={t} className={`w-12 h-1 ${state[t] || t === 'BRIEFING' ? 'bg-[#d4a017]' : 'bg-white/5'}`} />
                      ))}
                  </div>
              </div>
          </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-20 border-r-2 border-[#3a2810] bg-[#0c0803] flex flex-col items-center py-8 gap-8">
              {(['HTML', 'CSS', 'PYTHON', 'BRIEFING'] as Task[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setActiveTask(t)}
                    className={`relative group ${activeTask === t ? 'text-[#d4a017]' : 'text-[#a07830]/40'}`}
                  >
                      {t === 'HTML' && <Code2 className="w-6 h-6" />}
                      {t === 'CSS' && <Zap className="w-6 h-6" />}
                      {t === 'PYTHON' && <Cpu className="w-6 h-6" />}
                      {t === 'BRIEFING' && <Terminal className="w-6 h-6" />}
                      {state[t] && t !== 'BRIEFING' && <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-500 fill-black" />}
                  </button>
              ))}
          </div>

          {/* Editor Pane */}
          <div className="flex-1 flex flex-col border-r-2 border-[#3a2810]">
              <div className="p-10 flex-1 overflow-y-auto">
                  <div className="max-w-2xl">
                      {activeTask === 'BRIEFING' ? (
                          <div className="space-y-6">
                              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Consultant Briefing</h2>
                              <p className="text-[#a07830] leading-relaxed mb-10 text-sm">Reviewing interrogation logs from Karan Sehgal regarding the Meridian Bank AUDIT discrepancy.</p>
                              
                              <div className="space-y-4">
                                  <div className="bg-[#0c0803] border-2 border-[#3a2810] p-4 group hover:border-[#d4a017] transition-all">
                                      <div className="text-[#d4a017] font-bold text-sm mb-2">&gt; "Why are there over 4,000 extra simulations in the raw archive?"</div>
                                      <div className="text-[#a07830] text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                                          "Standard stress-testing protocol. You don't find vulnerabilities by running a test once. You run it thousands of times with micro-variations. The 12 vulnerabilities in my final report were the only ones that actually proved exploitable. The rest was just noise."
                                      </div>
                                  </div>
                                  <div className="bg-[#0c0803] border-2 border-[#3a2810] p-4 group hover:border-[#d4a017] transition-all">
                                      <div className="text-[#d4a017] font-bold text-sm mb-2">&gt; "Why did some simulations target 'guard rotation gaps'?"</div>
                                      <div className="text-[#a07830] text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                                          "Because physical security is part of the digital threat matrix. If a rogue actor can physically access a terminal during a shift change, all the firewalls in the world won't stop them. It's a comprehensive audit."
                                      </div>
                                  </div>
                                  <div className="bg-[#0c0803] border-2 border-[#3a2810] p-4 group hover:border-[#d4a017] transition-all">
                                      <div className="text-[#d4a017] font-bold text-sm mb-2">&gt; "What about the LIVE_RUN_PARAMS file?"</div>
                                      <div className="text-[#a07830] text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                                          "I have no idea what you're talking about. I tag all my configuration files as TEST_CONFIG. If there's an anomaly in the tagging schema, you should check with the junior archivist in Compliance."
                                      </div>
                                  </div>
                              </div>

                              {(state.HTML && state.CSS && state.PYTHON) && (
                                  <motion.button 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => window.location.href = '/'}
                                    className="w-full py-6 bg-[#d4a017] text-black font-black uppercase tracking-[0.3em] text-sm mt-12 hover:bg-[#f0d070] transition-all shadow-[0_0_30px_rgba(212,160,23,0.3)] group"
                                  >
                                      Finalize Restoration & Proceed <ChevronRight className="inline-block w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                  </motion.button>
                              )}
                          </div>
                      ) : (
                          <>
                              <div className="flex items-center gap-3 text-red-500 mb-4">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Corruption Detected</span>
                              </div>
                              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{taskPrompts[activeTask].title}</h2>
                              <p className="text-[#a07830] leading-relaxed mb-10 text-sm">{taskPrompts[activeTask].desc}</p>
        
                              <div className="bg-[#0c0803] border-2 border-[#3a2810] p-6 mb-6">
                                  <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest mb-4 border-b border-[#3a2810] pb-2">Reference Code</div>
                                  <pre className="text-xs text-white/40 italic mb-6">{taskPrompts[activeTask].startingCode}</pre>
                                  
                                  <div className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest mb-2">Editor Input</div>
                                  <textarea 
                                      value={userInput}
                                      onChange={(e) => setUserInput(e.target.value)}
                                      placeholder="Inject code here..."
                                      className="w-full h-40 bg-black border border-[#3a2810] p-4 text-xs font-mono text-[#f0d070] focus:border-[#d4a017] outline-none transition-all"
                                  />
                              </div>
        
                              {error && (
                                  <div className="p-4 bg-red-900/10 border border-red-900/40 text-red-500 text-[10px] uppercase tracking-widest font-black mb-6">
                                      {error}
                                  </div>
                              )}
        
                              {state[activeTask] ? (
                                  <button 
                                    onClick={() => {
                                        if (activeTask === 'HTML') setActiveTask('CSS');
                                        else if (activeTask === 'CSS') setActiveTask('PYTHON');
                                        else if (activeTask === 'PYTHON') setActiveTask('BRIEFING');
                                    }}
                                    className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-green-500 transition-all shadow-xl active:scale-95"
                                  >
                                      Task Complete - Proceed <ChevronRight className="w-4 h-4" />
                                  </button>
                              ) : (
                                  <button 
                                    onClick={handleSubmit}
                                    className="flex items-center gap-3 px-8 py-4 bg-[#d4a017] text-black font-black uppercase tracking-widest text-[11px] hover:bg-[#f0d070] transition-all shadow-xl active:scale-95"
                                  >
                                      Deploy Patch <ChevronRight className="w-4 h-4" />
                                  </button>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>

          {/* Preview Pane */}
          <div className="w-[450px] bg-[#140e06] p-10 flex flex-col items-center justify-center relative">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-l-2 border-[#3a2810] opacity-20" 
                   style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3a2810 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10 text-center">
                  <Terminal className={`w-20 h-20 mx-auto mb-8 transition-all duration-1000 ${state[activeTask] ? 'text-green-500 scale-110 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-[#a07830] animate-pulse'}`} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4">Output Visualization</h3>
                  
                  <div className="w-64 h-64 bg-black border-2 border-[#3a2810] flex items-center justify-center overflow-hidden relative group">
                      <AnimatePresence mode="wait">
                          {activeTask === 'BRIEFING' ? (
                              <div className="w-full h-full p-6 font-mono text-[10px] flex flex-col gap-2">
                                   <div className="text-[#d4a017] uppercase tracking-widest border-b border-[#3a2810] pb-1 flex items-center gap-2">
                                       <Terminal className="w-3 h-3" /> AUDIO LOG TRANSCRIPT
                                   </div>
                                   <div className="flex-1 text-[#a07830] overflow-y-auto whitespace-pre-wrap mt-4 text-xs">
                                       [INTERVIEW ROOM 2]<br/><br/>
                                       <strong>Detective:</strong> "You have a very thorough process, Mr. Sehgal."<br/><br/>
                                       <strong>Sehgal:</strong> "I'm paid to be thorough. The bank's security depends on it."<br/><br/>
                                       <strong>Detective:</strong> "And what about the anomalies in the logs?"<br/><br/>
                                       <strong>Sehgal:</strong> "Anomalies are just data points that haven't been contextualized yet."
                                   </div>
                               </div>
                          ) : state[activeTask] ? (
                              <motion.div 
                                key="fragment"
                                initial={{ opacity: 0, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                className="w-full h-full relative"
                              >
                                  <img 
                                    src={taskFragments[activeTask as 'HTML' | 'CSS' | 'PYTHON']} 
                                    alt="Evidence Fragment"
                                    className="w-full h-full object-cover grayscale brightness-50"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-[#d4a017] text-black px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                                          Evidence Restored
                                      </div>
                                  </div>
                              </motion.div>
                          ) : (activeTask === 'HTML' || activeTask === 'CSS') ? (
                              <iframe 
                                title="preview"
                                srcDoc={`
                                  <html>
                                    <head>
                                      <style>
                                        body { color: #f4e6c4; font-family: monospace; padding: 20px; font-size: 10px; background: #000; }
                                        table { border: 1px solid #3a2810; width: 100%; border-collapse: collapse; }
                                        td { border: 1px solid #3a2810; padding: 4px; }
                                        .suspect-feed { width: 100%; height: 150px; background: url('${taskFragments.CSS}'); background-size: cover; filter: blur(20px); }
                                      </style>
                                    </head>
                                    <body>${previewContent}</body>
                                  </html>
                                `}
                                className="w-full h-full border-none pointer-events-none"
                              />
                          ) : activeTask === 'PYTHON' ? (
                               <div className="w-full h-full p-6 font-mono text-[10px] flex flex-col gap-2">
                                   <div className="text-[#d4a017] uppercase tracking-widest border-b border-[#3a2810] pb-1 flex items-center gap-2">
                                       <Cpu className="w-3 h-3" /> Console Output
                                   </div>
                                   <div className="flex-1 text-green-500 overflow-y-auto whitespace-pre-wrap">
                                       {pythonOutput || '> Waiting for script execution...'}
                                   </div>
                               </div>
                          ) : (
                              <motion.div 
                                key="scrambled"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-[10px] text-[#a07830] opacity-30 leading-none break-all p-4"
                              >
                                  {Array.from({length: 20}).map((_, i) => (
                                      <div key={i} className="mb-1">{Math.random().toString(36).substring(2, 15)}</div>
                                  ))}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </div>
          </div>
      </main>

      {/* Restoration Overlay */}
      <AnimatePresence>
          {restoring && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] bg-[#d4a017] flex flex-col items-center justify-center text-black overflow-hidden"
              >
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }}
                    className="absolute bottom-0 left-0 h-2 bg-black"
                  />
                  <Shield className="w-32 h-32 mb-12 animate-bounce" />
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic mb-4">System Restored</h2>
                  <p className="text-sm font-bold uppercase tracking-[0.4em] opacity-70">Redirecting to Bureau Operations...</p>
              </motion.div>
          )}
      </AnimatePresence>

      <style>{`
          .scanline {
              width: 100%;
              height: 100px;
              background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(212, 160, 23, 0.1) 50%, rgba(0, 0, 0, 0) 100%);
              position: absolute;
              bottom: 100%;
              animation: scanline 8s linear infinite;
          }
          @keyframes scanline {
              0% { bottom: 100%; }
              100% { bottom: -100px; }
          }
      `}</style>
    </div>
  );
}
