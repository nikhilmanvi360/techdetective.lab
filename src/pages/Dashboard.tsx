import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Database, Fingerprint, Settings, Puzzle, CheckCircle } from 'lucide-react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCases(data);
        } else {
          setCases([]);
        }
      } catch (err) {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const getProtocolIcon = (index: number) => {
    const icons = [Search, Puzzle, Fingerprint, CheckCircle];
    const Icon = icons[index % icons.length];
    return <Icon className="w-8 h-8 text-[#5a4832] opacity-80" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Database className="w-12 h-12 text-[#d1b88a] animate-pulse" />
        <div className="font-display text-[#d1b88a] tracking-widest uppercase typewriter-text">Searching Archives...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto space-y-16">
      
      {/* Torn Paper Briefing Banner */}
      <div className="relative w-full max-w-4xl pt-8 pb-10 px-16 paper-card text-center bg-[#fdfbf2] mt-4">
        <div className="pushpin left-1/2 -top-2 -translate-x-1/2" />
        <h4 className="text-sm font-sans font-bold text-[#8b0000] tracking-[0.3em] uppercase mb-2">Tactical Briefing</h4>
        <h1 className="text-5xl font-display text-[#111] uppercase tracking-tighter mb-4 stamp !border-none !rotate-0 !p-0">
          Operation: DIGITAL_GHOST
        </h1>
        <p className="typewriter-text text-[#333] max-w-2xl mx-auto text-sm leading-relaxed">
          Cyber Command has detected multiple intrusion vectors. Your objective is to neutralize the threat by analyzing raw telemetry and decoding the adversary's playbook.
        </p>
        
        {/* Fake paper stains/tears */}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full border border-[rgba(100,60,20,0.1)] shadow-[inset_0_0_10px_rgba(100,60,20,0.1)]" />
        <div className="absolute bottom-6 right-8 w-16 h-16 rounded-full border-2 border-[rgba(139,69,19,0.05)] shadow-[inset_0_0_15px_rgba(139,69,19,0.08)]" />
      </div>

      {/* Case Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 w-full pt-4">
        {cases.map((c, index) => (
          <Link to={`/case/${c.id}`} onClick={() => playSound('click')} key={c.id} className="block group">
            <div className="folder p-6 aspect-[4/5] flex flex-col items-center justify-center text-center relative group-hover:-translate-y-2 transition-transform duration-300">
              <div className="folder-tab text-[10px] font-sans font-bold text-[rgba(0,0,0,0.5)] tracking-widest uppercase flex items-center justify-center">
                Protocol {(index + 1).toString().padStart(2, '0')}
              </div>
              <div className="paper-clip" />
              
              <div className="mb-4 bg-[#fdfbf2] p-4 rounded shadow-sm border border-[rgba(0,0,0,0.05)] transform rotate-1 group-hover:rotate-0 transition-transform">
                {getProtocolIcon(index)}
              </div>
              
              <h3 className="font-display text-xl text-[#222] font-bold uppercase mb-2 leading-tight">
                {c.title.split(' ')[0]} <br/> {c.title.split(' ').slice(1).join(' ')}
              </h3>
              
              <div className="typewriter-text text-sm text-[#444] line-clamp-3">
                {c.description}
              </div>

              {c.difficulty === 'Hard' && (
                <div className="absolute bottom-4 right-4 stamp text-xs">RESTRICTED</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Live Evidence Feed Teletype */}
      <div className="w-full max-w-2xl mt-12 mb-8">
        <div className="bg-[#f9f7f1] border-2 border-dashed border-gray-400 p-6 relative shadow-md">
          <div className="absolute top-4 left-0 w-full flex justify-center items-center gap-2 text-gray-600">
            <Search className="w-4 h-4" />
            <span className="font-display text-sm tracking-[0.2em] uppercase font-bold">Teletype Feed</span>
          </div>
          
          <div className="mt-8 text-center">
            <Search className="w-8 h-8 text-gray-400 mx-auto animate-pulse mb-3" />
            <div className="typewriter-text text-black text-sm tracking-widest uppercase opacity-70 font-bold">
              Listening to dispatch channels...
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
