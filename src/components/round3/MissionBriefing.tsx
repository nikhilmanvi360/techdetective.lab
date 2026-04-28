import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Zap, ArrowRight } from 'lucide-react';

export default function MissionBriefing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-8">
      <div className="max-w-6xl w-full space-y-16">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black text-[#d4a017] uppercase tracking-[1em]"
          >
            Operation: The Verdict
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter"
          >
            Mission <span className="text-[#d4a017]">Briefing</span>
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              phase: 'A',
              title: 'Technical Stabilization',
              desc: 'Fix the corrupted JSON artifact on your terminal to unlock critical system data.',
              icon: Shield,
              color: 'text-blue-500'
            },
            {
              phase: 'B',
              title: 'Deductive Reasoning',
              desc: 'Submit a structured report identifying the culprit, their method, and evidence.',
              icon: FileText,
              color: 'text-[#d4a017]'
            },
            {
              phase: 'C',
              title: 'The Counter-Strike',
              desc: 'Execute the final mitigation sequence to neutralize the threat for good.',
              icon: Zap,
              color: 'text-red-500'
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-[#0c0803] border-2 border-[#3a2810] p-10 relative group hover:border-[#d4a017]/50 transition-all shadow-2xl"
            >
              <div className="text-5xl font-black text-[#3a2810] absolute top-4 right-6 group-hover:text-[#d4a017]/20 transition-colors">
                {item.phase}
              </div>
              <item.icon className={`w-12 h-12 ${item.color} mb-8`} />
              <h2 className="text-2xl font-black text-[#f4e6c4] uppercase tracking-tight mb-4">{item.title}</h2>
              <p className="text-[#a07830] font-mono text-sm leading-relaxed">{item.desc}</p>
              
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-[#d4a017] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Awaiting Authorization <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-red-900/10 border-2 border-red-900/30 p-6 text-center"
        >
          <div className="text-red-500 font-black uppercase tracking-[0.4em] text-xs">
            Critical Warning: All phases must be completed simultaneously. 45 minutes remaining.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
