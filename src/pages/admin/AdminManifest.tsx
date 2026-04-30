import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Database, Key, Map as MapIcon, Search, Shield, Zap } from 'lucide-react';

export default function AdminManifest() {
  const manifest = [
    {
      round: "Round 0: The Briefing",
      icon: <Search className="w-5 h-5" />,
      color: "#d4a017",
      items: [
        { label: "HTML Task", answer: "Wrap content in <table> and </table> tags." },
        { label: "CSS Task", answer: "Set 'filter: none;' on the .suspect-feed class." },
        { label: "Python Task", answer: "Extract '91.4' and print it (Success rate > 90)." }
      ]
    },
    {
      round: "Round 1: The Logs",
      icon: <ClipboardList className="w-5 h-5" />,
      color: "#a07830",
      items: [
        { label: "EV-01", answer: "Simulation Anomaly (K_SEHGAL unauthorized start)." },
        { label: "EV-02", answer: "Credential Extraction (vault_keys memory dump)." },
        { label: "EV-03", answer: "Audit Log Purge (SYSTEM_ROOT log deletion)." }
      ]
    },
    {
      round: "Round 2: The Map",
      icon: <MapIcon className="w-5 h-5" />,
      color: "#1a6a8a",
      items: [
        { label: "Lobby Clue", answer: "Sehgal arrived at 11:05 PM (Security Log discrepancy)." },
        { label: "Archive Clue", answer: "LIVE_RUN_PARAMS tag misused instead of TEST_CONFIG." },
        { label: "Server Clue", answer: "4,247 simulations executed in Node Beta." }
      ]
    },
    {
      round: "Round 3: The Archive",
      icon: <Database className="w-5 h-5" />,
      color: "#d4a017",
      items: [
        { label: "Target Batch", answer: "batch_087" },
        { label: "Target File", answer: "run_31.sim (Contains the real heist rehearsal params)." }
      ]
    },
    {
      round: "Round 4: The Verdict",
      icon: <Shield className="w-5 h-5" />,
      color: "#8B2020",
      items: [
        { label: "Phase A (Timeline)", answer: "Sequence: [1, 4, 7, 9, 10]" },
        { label: "Phase B (Culprit)", answer: "Karan Sehgal" },
        { label: "Phase B (Purpose)", answer: "Bank Heist Rehearsal" },
        { label: "Phase B (Action)", answer: "Immediate Apprehension" }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// OPERATIONAL_MANIFEST</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            System <span className="text-[#d4a017]">Oracle</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {manifest.map((section, idx) => (
          <motion.div
            key={section.round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#140e06] border-2 border-[#3a2810] p-6 relative group overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#3a2810]">
              <div className="p-2 border border-[#d4a017]/30" style={{ color: section.color }}>
                {section.icon}
              </div>
              <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-widest">{section.round}</h2>
            </div>

            <div className="space-y-4">
              {section.items.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-[9px] font-black text-[#a07830] uppercase tracking-widest">{item.label}</div>
                  <div className="bg-black/40 border border-[#3a2810] p-3 text-xs font-mono text-[#f0d070] leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-0 right-0 opacity-[0.03] transform translate-x-4 -translate-y-4">
              {React.cloneElement(section.icon, { size: 120 })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
