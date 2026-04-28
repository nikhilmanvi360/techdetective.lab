import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

export default function OpeningMonologue({ data }: { data: any }) {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const lines = [
    `I have been watching since the ${data?.eventName || '[EVENT NAME]'} began.`,
    '',
    `I know which team ${data?.round1Action || '[SPECIFIC ACTION FROM ROUND 1]'}.`,
    `I know which team ${data?.round2Action || '[SPECIFIC ACTION FROM ROUND 2]'}.`,
    `I know which team submitted ${data?.suspectAnswer || '[SUSPECT/ANSWER]'} at ${data?.timestamp || '[REAL TIMESTAMP]'}.`,
    `I know which team is currently in ${data?.rank || '[PLACE]'} by ${data?.points || '[N]'} points.`,
    '',
    'None of this matters.',
    '',
    `You have spent two rounds looking for ${data?.redHerring || '[RED HERRING NAME]'}.`,
    `${data?.redHerring || '[RED HERRING NAME]'} was a ${data?.twistReveal || '[TWIST REVEAL LINE]'}.`,
    '',
    `The question you forgot to ask is: ${data?.realQuestion || '[THE REAL QUESTION]'}.`,
    '',
    `You have ${data?.duration || '[X]'} minutes.`,
    'Find the answer. Or don\'t.',
    '',
    `— ${data?.aiName || '[AI ENTITY NAME]'}`
  ];

  useEffect(() => {
    setDisplayText([]);
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setDisplayText(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 bg-black">
      <div className="w-full max-w-4xl space-y-6 font-mono">
        <div className="flex items-center gap-4 mb-12 opacity-50">
          <Terminal className="w-6 h-6 text-[#d4a017]" />
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#d4a017] to-transparent" />
          <div className="text-[10px] tracking-[0.5em] text-[#d4a017]">DIRECT_NEURAL_LINK_ESTABLISHED</div>
        </div>

        <div className="space-y-4">
          {displayText.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className={`text-xl md:text-3xl font-bold tracking-tight ${line?.startsWith('—') ? 'text-[#d4a017] mt-12 italic' : 'text-[#f4e6c4]'}`}
            >
              {line || '\u00A0'}
            </motion.div>
          ))}
          <motion.div
            animate={{ opacity: [0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-4 h-8 bg-[#d4a017] inline-block align-middle"
          />
        </div>
      </div>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1208_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>
    </div>
  );
}
