import { useState, useEffect } from 'react';
import { Trophy, Medal, Target, Users, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { ScoreEntry } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle, getRankColor } from '../utils/ranks';

export default function Scoreboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch('/api/scoreboard');
        const data = await response.json();
        setScores(data);
      } catch (err) {
        console.error('Failed to fetch scoreboard');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
    
    const socket = io();
    socket.on('score_update', () => {
      fetchScores();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-terminal-green" />
          <span className="font-mono text-terminal-green tracking-widest">CALCULATING_RANKS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-terminal-green/10 rounded-full border border-terminal-green/20 mb-2">
          <Trophy className="w-12 h-12 text-terminal-green" />
        </div>
        <h1 className="text-4xl font-mono font-bold text-white uppercase tracking-tighter">Global Scoreboard</h1>
        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">Top investigators currently in the field</p>
      </div>

      <div className="terminal-card">
        <div className="terminal-header">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-terminal-green" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Live Rankings</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Updated: Just Now</span>
        </div>

        <div className="overflow-hidden">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-terminal-line bg-black/40">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Investigator Team</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, index) => (
                <motion.tr 
                  key={entry.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-terminal-line/50 hover:bg-terminal-green/5 transition-colors ${index === 0 ? 'bg-terminal-green/5' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="w-4 h-4 text-yellow-500" />}
                      {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                      {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                      <span className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-500'}`}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-terminal-green border-terminal-green text-black' : 'bg-terminal-line/30 border-terminal-line text-gray-400'
                      }`}>
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className={index === 0 ? 'text-terminal-green font-bold' : 'text-white'}>
                          {entry.name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest ${getRankColor(entry.score)}`}>
                          {getRankTitle(entry.score)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Target className="w-3 h-3 text-terminal-green/50" />
                      <span className="font-bold text-white">{entry.score.toLocaleString()}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
              
              {scores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-600 uppercase tracking-widest italic">
                    No investigation data recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="terminal-card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Active Teams</h4>
            <p className="text-2xl font-mono font-bold text-white">{scores.length}</p>
          </div>
        </div>
        <div className="terminal-card p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-full">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Average Score</h4>
            <p className="text-2xl font-mono font-bold text-white">
              {scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
