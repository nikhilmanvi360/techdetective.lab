import React, { useState, useEffect } from 'react';
import {
  Shield, Users, FileText, CheckCircle, XCircle, Clock,
  Search, Terminal, Key, Edit2, Save, Ban, Check, Plus,
  BarChart2, Download, Activity, Cpu, Zap, Send, Database, AlertCircle, TrendingUp, Crosshair, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Submission, Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSound } from '../hooks/useSound';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'answers' | 'teams' | 'builder' | 'analytics' | 'events' | 'multipliers' | 'adversary'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [masterKey, setMasterKey] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [multipliers, setMultipliers] = useState<any[]>([]);
  const [adversaryConfig, setAdversaryConfig] = useState<any>(null);
  const [adversaryLog, setAdversaryLog] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { playSound } = useSound();

  // Team editing state
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, score: number, is_disabled: boolean }>({ name: '', score: 0, is_disabled: false });

  // Builder state
  const [newCase, setNewCase] = useState({ title: '', description: '', difficulty: 'Beginner', correct_attacker: '', points_on_solve: 100 });
  const [newEvidence, setNewEvidence] = useState({ case_id: '', type: 'chat', title: '', content: '', metadata: '', required_puzzle_id: '', linked_puzzles: '', linked_evidence: '' });
  const [newPuzzle, setNewPuzzle] = useState({ case_id: '', question: '', answer: '', points: 10, hint: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const [subRes, keyRes, teamsRes, analyticsRes, eventsRes, multRes, advConfRes, advLogRes] = await Promise.all([
          fetch('/api/admin/submissions', { headers }),
          fetch('/api/admin/master-key', { headers }),
          fetch('/api/admin/teams', { headers }),
          fetch('/api/admin/analytics', { headers }),
          fetch('/api/admin/events', { headers }),
          fetch('/api/admin/multipliers', { headers }),
          fetch('/api/admin/adversary', { headers }),
          fetch('/api/admin/adversary/log', { headers }),
        ]);

        if (subRes.ok && keyRes.ok && teamsRes.ok && analyticsRes.ok) {
          const subData = await subRes.json();
          const keyData = await keyRes.json();
          const teamsData = await teamsRes.json();
          const analyticsData = await analyticsRes.json();
          
          if (Array.isArray(subData)) setSubmissions(subData);
          if (Array.isArray(keyData)) setMasterKey(keyData);
          if (Array.isArray(teamsData)) setTeams(teamsData);
          if (Array.isArray(analyticsData)) setAnalytics(analyticsData);
          
          if (eventsRes.ok) {
            const evData = await eventsRes.json();
            if (Array.isArray(evData)) setEvents(evData);
          }
          if (multRes.ok) {
            const mData = await multRes.json();
            if (Array.isArray(mData)) setMultipliers(mData);
          }
          if (advConfRes.ok) setAdversaryConfig(await advConfRes.json());
          if (advLogRes.ok) {
            const alData = await advLogRes.json();
            if (Array.isArray(alData)) setAdversaryLog(alData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditTeam = (team: Team) => {
    playSound('click');
    setEditingTeamId(team.id);
    setEditForm({ name: team.name, score: team.score, is_disabled: !!team.is_disabled });
  };

  const handleSaveTeam = async (id: number) => {
    playSound('click');
    try {
      const response = await fetch(`/api/admin/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        playSound('success');
        setTeams(teams.map(t => t.id === id ? { ...t, ...editForm } : t));
        setEditingTeamId(null);
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      console.error('Failed to update team');
    }
  };

  const handleToggleDisable = async (team: Team) => {
    playSound('click');
    const newStatus = !team.is_disabled;
    try {
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: team.name, score: team.score, is_disabled: newStatus })
      });

      if (response.ok) {
        playSound(newStatus ? 'error' : 'success');
        setTeams(teams.map(t => t.id === team.id ? { ...t, is_disabled: newStatus } : t));
      }
    } catch (err) {
      playSound('error');
      console.error('Failed to toggle team status');
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newCase)
      });
      if (res.ok) {
        playSound('success');
        alert('Case created successfully');
        setNewCase({ title: '', description: '', difficulty: 'Beginner', correct_attacker: '', points_on_solve: 100 });
        const keyRes = await fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (keyRes.ok) setMasterKey(await keyRes.json());
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      alert('Failed to create case');
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    try {
      let parsedMetadata: any = {};
      if (newEvidence.metadata) {
        try {
          parsedMetadata = JSON.parse(newEvidence.metadata);
        } catch (err) {
          playSound('error');
          alert('Invalid JSON in metadata');
          return;
        }
      }

      if (newEvidence.linked_puzzles) {
        parsedMetadata.linkedPuzzles = newEvidence.linked_puzzles.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
      if (newEvidence.linked_evidence) {
        parsedMetadata.linkedEvidence = newEvidence.linked_evidence.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }

      const finalMetadata = Object.keys(parsedMetadata).length > 0 ? JSON.stringify(parsedMetadata) : null;

      const res = await fetch('/api/admin/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          ...newEvidence,
          metadata: finalMetadata,
          required_puzzle_id: newEvidence.required_puzzle_id || null
        })
      });
      if (res.ok) {
        playSound('success');
        alert('Evidence added successfully');
        setNewEvidence({ case_id: '', type: 'chat', title: '', content: '', metadata: '', required_puzzle_id: '', linked_puzzles: '', linked_evidence: '' });
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      alert('Failed to add evidence');
    }
  };

  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    try {
      const res = await fetch('/api/admin/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newPuzzle)
      });
      if (res.ok) {
        playSound('success');
        alert('Puzzle added successfully');
        setNewPuzzle({ case_id: '', question: '', answer: '', points: 10, hint: '' });
        const keyRes = await fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (keyRes.ok) setMasterKey(await keyRes.json());
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      alert('Failed to add puzzle');
    }
  };

  const handleActivateMultiplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    playSound('click');
    const formData = new FormData(e.currentTarget);
    const multiplier = parseFloat(formData.get('multiplier') as string);
    const durationMinutes = parseInt(formData.get('durationMinutes') as string);
    
    try {
      const res = await fetch('/api/admin/multipliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ multiplier, durationMinutes, eventTypes: ['puzzle_solve', 'case_solve'] })
      });
      if (res.ok) {
        playSound('success');
        alert('Multiplier Activated!');
        const text = await fetch('/api/admin/multipliers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
        setMultipliers(text);
      }
    } catch { playSound('error'); }
  };

  const handleUpdateAdversary = async (updates: any) => {
    playSound('click');
    try {
      const res = await fetch('/api/admin/adversary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        playSound('success');
        setAdversaryConfig({ ...adversaryConfig, ...updates });
      }
    } catch { playSound('error'); }
  };

  const handleTriggerAdversary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    playSound('click');
    const formData = new FormData(e.currentTarget);
    const targetTeamId = parseInt(formData.get('targetTeamId') as string);
    const actionType = formData.get('actionType') as string;
    const message = formData.get('message') as string;

    try {
      const res = await fetch('/api/admin/adversary/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ targetTeamId, actionType, message })
      });
      if (res.ok) {
        playSound('success');
        alert('Action Triggered!');
        const text = await fetch('/api/admin/adversary/log', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
        setAdversaryLog(text);
      }
    } catch { playSound('error'); }
  };

  const exportTeamsCSV = () => {
    playSound('ping');
    const headers = ['ID', 'Team Name', 'Score', 'Status', 'Joined'];
    const rows = teams.map(t => [t.id, `"${t.name}"`, t.score, t.is_disabled ? 'Disabled' : 'Active', t.created_at]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teams_export.csv';
    link.click();
  };

  const exportSubmissionsCSV = () => {
    playSound('ping');
    const headers = ['ID', 'Team', 'Case', 'Suspect', 'Method', 'Prevention', 'Status', 'Time'];
    const rows = submissions.map(s => [
      s.id, `"${s.team_name}"`, `"${s.case_title}"`, `"${s.attacker_name}"`,
      `"${s.attack_method.replace(/"/g, '""')}"`, `"${s.prevention_measures.replace(/"/g, '""')}"`,
      s.status, s.submitted_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'submissions_export.csv';
    link.click();
  };

  const filteredSubmissions = submissions.filter(s =>
    s.team_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.case_title?.toLowerCase().includes(filter.toLowerCase()) ||
    s.attacker_name.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Activity className="w-12 h-12 text-red-900 animate-pulse" />
      <div className="font-display text-red-900 uppercase tracking-[0.4em]  text-center">
        Accessing_Restricted_Database...
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#fdfbf2] border-2 border-[#8b0000] shadow-[4px_4px_0_rgba(139,0,0,1)]">
            <Shield className="w-10 h-10 text-red-900 " />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-black uppercase tracking-tight leading-none">CCU_COMMAND_CENTER</h1>
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-[0.4em] mt-2">Global Investigation Oversight Node</p>
          </div>
        </div>

        <div className="flex flex-wrap bg-gray-200 border-2 border-gray-400 p-1 border border-[rgba(0,0,0,0.2)]">
          {[
            { id: 'submissions', label: 'Reports', icon: <FileText className="w-3 h-3" />, color: 'green-800' },
            { id: 'teams', label: 'Teams', icon: <Users className="w-3 h-3" />, color: 'blue-900' },
            { id: 'answers', label: 'Master_Key', icon: <Key className="w-3 h-3" />, color: 'yellow-800' },
            { id: 'builder', label: 'Builder', icon: <Plus className="w-3 h-3" />, color: 'purple-500' },
            { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-3 h-3" />, color: 'orange-500' },
            { id: 'events', label: 'Event_Log', icon: <History className="w-3 h-3" />, color: 'cyan-400' },
            { id: 'multipliers', label: 'Multipliers', icon: <TrendingUp className="w-3 h-3" />, color: 'yellow-400' },
            { id: 'adversary', label: 'Adversary_AI', icon: <Crosshair className="w-3 h-3" />, color: 'red-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { playSound('click'); setActiveTab(tab.id as any); }}
              className={`px-4 py-2.5 text-[10px] font-display uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? `bg-${tab.color}/10 text-${tab.color} border border-${tab.color}/30` : 'text-gray-600 hover:text-black'
                }`}
            >
              {tab.icon} <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'submissions' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              {/* Submissions List */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.2)] pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-800" />
                    <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Recent Submissions</h2>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 group-focus-within:text-green-800 transition-colors" />
                    <input
                      type="text"
                      placeholder="SEARCH..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 pl-10 py-2 text-[10px] w-64 border-[rgba(0,0,0,0.2)] focus:border-green-800"
                    />
                  </div>
                </div>

                <div className="paper-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-display text-xs">
                      <thead className="bg-[#fdfaf1] border-2 border-black border-b border-[rgba(0,0,0,0.2)]">
                        <tr>
                          <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Unit_ID</th>
                          <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Case_Node</th>
                          <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Suspect</th>
                          <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Status</th>
                          <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Timestamp</th>
                          <th className="p-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-400/20">
                        {filteredSubmissions.map((s) => (
                          <tr key={s.id} className="hover:bg-[rgba(0,0,0,0.05)] transition-colors group">
                            <td className="p-5 text-black font-bold">{s.team_name}</td>
                            <td className="p-5 text-gray-700">{s.case_title}</td>
                            <td className="p-5 text-gray-700 uppercase tracking-tighter">{s.attacker_name}</td>
                            <td className="p-5">
                              <span className={`inline-flex items-center gap-2 px-2 py-0.5 border text-[9px] font-bold uppercase ${s.status === 'correct' ? 'border-green-800/30 text-green-800 bg-green-800/5' : 'border-red-900/30 text-red-900 bg-red-900/5'}`}>
                                {s.status === 'correct' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {s.status}
                              </span>
                            </td>
                            <td className="p-5 text-gray-600 font-mono text-[10px]">
                              {s.submitted_at ? new Date(s.submitted_at.replace(' ', 'T') + 'Z').toLocaleString() : 'UNKNOWN'}
                            </td>
                            <td className="p-5 text-right">
                              <button
                                onClick={() => { playSound('click'); setSelectedSubmission(s); }}
                                className="border-[2px] border-black bg-white text-black hover:bg-[#fdfaf1] hover:text-black px-2 py-1 text-[9px] font-bold"
                              >
                                Analyze_Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Report Detail View */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.2)] pb-4 px-2">
                  <Terminal className="w-5 h-5 text-green-800" />
                  <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Telemetry Analysis</h2>
                </div>

                <AnimatePresence mode="wait">
                  {selectedSubmission ? (
                    <motion.div
                      key={selectedSubmission.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="paper-card p-8 space-y-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Activity className="w-20 h-20 text-green-800" />
                      </div>
                      <div className="space-y-2 relative z-10">
                        <div className="text-[9px] font-display text-green-800 uppercase tracking-[0.3em]">Unit_Telemetry_Stream</div>
                        <h3 className="text-2xl font-display font-bold text-black uppercase tracking-tight">
                          {selectedSubmission.team_name}
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-display text-gray-600 uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" /> Identifier Host
                          </div>
                          <p className="text-sm font-mono text-black bg-[#fdfaf1] border-2 border-black p-3 border border-[rgba(0,0,0,0.2)]">
                            {selectedSubmission.attacker_name}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-display text-gray-600 uppercase tracking-widest">
                            <Database className="w-3 h-3" /> Technical Breakdown
                          </div>
                          <div className="text-xs font-mono text-gray-700 bg-[#fdfaf1] border-2 border-black p-4 border border-[rgba(0,0,0,0.2)] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar italic font-light">
                            {selectedSubmission.attack_method}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-display text-gray-600 uppercase tracking-widest">
                            <Shield className="w-3 h-3" /> Counter-Op Strategy
                          </div>
                          <div className="text-xs font-mono text-gray-700 bg-[#fdfaf1] border-2 border-black p-4 border border-[rgba(0,0,0,0.2)] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar opacity-80">
                            {selectedSubmission.prevention_measures}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[rgba(0,0,0,0.2)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                            NODE_ID_{selectedSubmission.id}
                          </span>
                        </div>
                        <button
                          onClick={() => { playSound('click'); setSelectedSubmission(null); }}
                          className="text-[9px] font-display text-gray-600 hover:text-black uppercase tracking-widest underline underline-offset-4"
                        >
                          Close_Stream
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="paper-card p-16 flex flex-col items-center justify-center text-center space-y-6 opacity-30 group border-dashed">
                      <div className="p-6 border border-[rgba(0,0,0,0.2)] group-hover:border-green-800 transition-all">
                        <FileText className="w-12 h-12 text-gray-700 group-hover:text-green-800" />
                      </div>
                      <p className="text-[10px] font-display text-gray-600 uppercase tracking-[0.4em] max-w-[150px] leading-loose">
                        Select an investigative report for matrix verification
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.2)] pb-4 px-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-900" />
                  <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Unit Registry Management</h2>
                </div>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 group-focus-within:text-blue-900 transition-colors" />
                  <input
                    type="text"
                    placeholder="SEARCH_UNITS..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 pl-10 py-2 text-[10px] w-64 border-[rgba(0,0,0,0.2)] focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="paper-card overflow-hidden border-blue-900/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-display text-xs">
                    <thead className="bg-blue-900/5 border-b border-blue-900/20">
                      <tr>
                        <th className="p-5 text-gray-600 uppercase tracking-widest font-bold w-20">RK_ID</th>
                        <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Unit_Identifier</th>
                        <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Payload_XP</th>
                        <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Operational_State</th>
                        <th className="p-5 text-gray-600 uppercase tracking-widest font-bold">Joined_Node</th>
                        <th className="p-5 text-right text-gray-600 uppercase tracking-widest font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-400/20">
                      {filteredTeams.map((t) => (
                        <tr key={t.id} className={`hover:bg-[rgba(0,0,0,0.05)] transition-colors group ${t.is_disabled ? 'opacity-40 grayscale' : ''}`}>
                          <td className="p-5 text-gray-600 font-mono">0x{t.id.toString(16).toUpperCase()}</td>
                          <td className="p-5">
                            {editingTeamId === t.id ? (
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 py-1 text-xs w-full focus:border-blue-900"
                              />
                            ) : (
                              <span className="text-black font-bold text-sm tracking-tight">{t.name}</span>
                            )}
                          </td>
                          <td className="p-5">
                            {editingTeamId === t.id ? (
                              <input
                                type="number"
                                value={editForm.score}
                                onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
                                className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 py-1 text-green-800 text-xs w-24 focus:border-green-800"
                              />
                            ) : (
                              <span className="text-green-800 font-bold tabular-nums">{t.score.toLocaleString()} XP</span>
                            )}
                          </td>
                          <td className="p-5">
                            {t.is_disabled ? (
                              <span className="text-red-900 flex items-center gap-2 border border-red-900/30 px-2 py-0.5 text-[9px] font-bold"><Ban className="w-3 h-3" /> DEACTIVATED</span>
                            ) : (
                              <span className="text-green-800 flex items-center gap-2 border border-green-800/30 px-2 py-0.5 text-[9px] font-bold"><CheckCircle className="w-3 h-3" /> NOMINAL</span>
                            )}
                          </td>
                          <td className="p-5 text-gray-600 font-mono text-[10px]">
                            {t.created_at ? new Date(t.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingTeamId === t.id ? (
                                <button
                                  onClick={() => handleSaveTeam(t.id)}
                                  className="p-2 border border-green-800 text-green-800 hover:bg-green-800 hover:text-black transition-colors"
                                  title="Sync Changes"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEditTeam(t)}
                                  className="p-2 border border-[rgba(0,0,0,0.2)] text-gray-600 hover:text-black hover:border-white transition-colors"
                                  title="Override Data"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleDisable(t)}
                                className={`p-2 border transition-colors ${t.is_disabled
                                    ? 'border-green-800 text-green-800 hover:bg-green-800 hover:text-black'
                                    : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-black'
                                  }`}
                                title={t.is_disabled ? "Restore Unit" : "Sever Connection"}
                              >
                                {t.is_disabled ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.2)] pb-4 px-2">
                <Key className="w-5 h-5 text-yellow-800" />
                <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Master Logic Key [CLASSIFIED_LEVEL_4]</h2>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {masterKey.map((caseItem) => (
                  <div key={caseItem.id} className="paper-card overflow-hidden border-yellow-800/30">
                    <div className="bg-yellow-800/5 px-8 py-5 border-b border-yellow-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-yellow-800 animate-pulse" />
                        <span className="text-lg font-display font-bold text-black uppercase tracking-tight">
                          Case_Node_{caseItem.id}: {caseItem.title.replace(' ', '_')}
                        </span>
                      </div>
                      <div className="bg-[#fdfaf1]/80 px-4 py-2 border border-yellow-800/30 flex items-center gap-4">
                        <span className="text-[9px] font-display text-gray-600 uppercase tracking-widest">Logic_Root:</span>
                        <span className="text-sm font-display font-bold text-yellow-800 uppercase tracking-widest">
                          {caseItem.correct_attacker}
                        </span>
                        <div className="w-[1px] h-4 bg-[rgba(0,0,0,0.2)]" />
                        <span className="text-xs font-display font-bold text-green-800 tabular-nums">
                          {caseItem.points_on_solve} XP
                        </span>
                      </div>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-left font-display text-xs">
                        <thead className="bg-gray-200 border-2 border-gray-400 border-b border-[rgba(0,0,0,0.2)]">
                          <tr>
                            <th className="p-4 text-gray-600 uppercase tracking-widest font-bold w-20">ID</th>
                            <th className="p-4 text-gray-600 uppercase tracking-widest font-bold">Operational_Query</th>
                            <th className="p-4 text-yellow-800 uppercase tracking-widest font-bold">Logic_Anchor</th>
                            <th className="p-4 text-gray-600 uppercase tracking-widest font-bold w-32">Payload</th>
                            <th className="p-4 text-gray-600 uppercase tracking-widest font-bold">Partial_Cipher (Hint)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-400/20">
                          {caseItem.puzzles.map((p: any) => (
                            <tr key={p.id} className="hover:bg-[rgba(0,0,0,0.05)] transition-colors">
                              <td className="p-4 text-gray-600 font-mono">0x{p.id.toString(16).toUpperCase()}</td>
                              <td className="p-4 text-gray-800 italic">" {p.question} "</td>
                              <td className="p-4">
                                <div className="bg-yellow-800/5 border border-yellow-800/20 px-3 py-1 text-yellow-800 font-bold inline-block">
                                  {p.answer}
                                </div>
                              </td>
                              <td className="p-4 text-green-800 font-bold tabular-nums">+{p.points} XP</td>
                              <td className="p-4 text-gray-600 italic text-[10px] max-w-sm line-clamp-1">{p.hint || 'NO_HINT_RECORDED'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-8">
                <div className="paper-card p-8 border-purple-500/40 relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <Plus className="w-16 h-16 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-purple-500/10 border border-purple-500/30">
                      <Database className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Initialize New Case</h2>
                  </div>
                  <form onSubmit={handleCreateCase} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Node Title</label>
                      <input type="text" required value={newCase.title} onChange={e => setNewCase({ ...newCase, title: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-purple-500" placeholder="CASE_IDENTIFIER" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Briefing Analysis</label>
                      <textarea required rows={4} value={newCase.description} onChange={e => setNewCase({ ...newCase, description: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs resize-none focus:border-purple-500 font-light" placeholder="Describe the intrusion vector..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Threat Level</label>
                        <select value={newCase.difficulty} onChange={e => setNewCase({ ...newCase, difficulty: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs bg-[#fdfaf1] focus:border-purple-500 tracking-widest">
                          <option>Easy</option>
                          <option>Intermediate</option>
                          <option>Hard</option>
                          <option>Insane</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Reward XP</label>
                        <input type="number" required value={newCase.points_on_solve} onChange={e => setNewCase({ ...newCase, points_on_solve: parseInt(e.target.value) || 0 })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-purple-500 tabular-nums" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Root Answer (Threat Actor)</label>
                      <input type="text" required value={newCase.correct_attacker} onChange={e => setNewCase({ ...newCase, correct_attacker: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-purple-500 border-l-2 border-l-purple-500" placeholder="FINAL_LOGIC_KEY" />
                    </div>
                    <button type="submit" className="border-[2px] border-black text-black bg-white hover:bg-[#fdfaf1] hover:text-black transition-colors p-2 font-display uppercase font-bold w-full h-12 bg-purple-500 text-black font-bold text-xs tracking-[0.2em] border-none mt-4 hover:scale-[1.02] transition-transform">
                      DEPLOY_CASE_NODE
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-10">
                <div className="paper-card p-8 border-blue-900/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <FileText className="w-24 h-24 text-blue-900" />
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-900/10 border border-blue-900/30">
                      <Activity className="w-5 h-5 text-blue-900" />
                    </div>
                    <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Upload Investigative Evidence</h2>
                  </div>
                  <form onSubmit={handleCreateEvidence} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Parent Case Node</label>
                        <select required value={newEvidence.case_id} onChange={e => setNewEvidence({ ...newEvidence, case_id: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs bg-[#fdfaf1] focus:border-blue-900">
                          <option value="">SELECT_TARGET_NODE...</option>
                          {masterKey.map(c => <option key={c.id} value={c.id}>0x{c.id.toString(16).toUpperCase()} // {c.title}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Telemetry Format</label>
                        <select required value={newEvidence.type} onChange={e => setNewEvidence({ ...newEvidence, type: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs bg-[#fdfaf1] focus:border-blue-900">
                          <option value="chat">COMM_STREAM (Chat)</option>
                          <option value="html">SYSTEM_HEX (HTML)</option>
                          <option value="log">SERVER_TRACE (Log)</option>
                          <option value="email">ENCRYPTED_MAIL (Email)</option>
                          <option value="code">SOURCE_MANIFEST (Code)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Fragment Identifier</label>
                      <input type="text" required value={newEvidence.title} onChange={e => setNewEvidence({ ...newEvidence, title: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-blue-900" placeholder="EVIDENCE_HEADING" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Raw Data Content</label>
                      <textarea required rows={5} value={newEvidence.content} onChange={e => setNewEvidence({ ...newEvidence, content: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs font-mono focus:border-blue-900 text-blue-900/80 scrollbar-hide" placeholder="HEX_DATA_BLOCK..." />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Metadata Matrix (JSON)</label>
                        <input type="text" placeholder='{"source": "10.0.0.1"}' value={newEvidence.metadata} onChange={e => setNewEvidence({ ...newEvidence, metadata: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs font-mono focus:border-blue-900 tracking-tighter" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Security Protocol (Min Puzzle ID)</label>
                        <input type="number" value={newEvidence.required_puzzle_id} onChange={e => setNewEvidence({ ...newEvidence, required_puzzle_id: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-blue-900" placeholder="LOCK_BY_ID" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Cross-Referenced Tasks</label>
                        <input type="text" placeholder="101, 102, 105" value={newEvidence.linked_puzzles} onChange={e => setNewEvidence({ ...newEvidence, linked_puzzles: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs font-mono focus:border-blue-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Linked Evidence Nodes</label>
                        <input type="text" placeholder="505, 508" value={newEvidence.linked_evidence} onChange={e => setNewEvidence({ ...newEvidence, linked_evidence: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs font-mono focus:border-blue-900" />
                      </div>
                    </div>
                    <button type="submit" className="border-[2px] border-black text-black bg-white hover:bg-[#fdfaf1] hover:text-black transition-colors p-2 font-display uppercase font-bold w-full h-12 bg-blue-900 text-black font-bold text-xs tracking-[0.2em] border-none mt-4 hover:scale-[1.02] transition-transform">
                      INJECT_FRAGMENTS
                    </button>
                  </form>
                </div>

                <div className="paper-card p-8 border-green-800/40 relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <Key className="w-16 h-16 text-green-800" />
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-green-800/10 border border-green-800/30">
                      <Zap className="w-5 h-5 text-green-800" />
                    </div>
                    <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Deploy Operational Task</h2>
                  </div>
                  <form onSubmit={handleCreatePuzzle} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Deployment Target</label>
                        <select required value={newPuzzle.case_id} onChange={e => setNewPuzzle({ ...newPuzzle, case_id: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs bg-[#fdfaf1] focus:border-green-800">
                          <option value="">SELECT_NODE...</option>
                          {masterKey.map(c => <option key={c.id} value={c.id}>0x{c.id.toString(16).toUpperCase()} // {c.title}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Operational Yield</label>
                        <input type="number" required value={newPuzzle.points} onChange={e => setNewPuzzle({ ...newPuzzle, points: parseInt(e.target.value) || 0 })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-green-800 tabular-nums" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Decryption Challenge (Question)</label>
                      <input type="text" required value={newPuzzle.question} onChange={e => setNewPuzzle({ ...newPuzzle, question: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-green-800" placeholder="CHALLENGE_QUERY" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Logic Anchor (Exact Answer)</label>
                      <input type="text" required value={newPuzzle.answer} onChange={e => setNewPuzzle({ ...newPuzzle, answer: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-green-800 border-l-2 border-l-green-800" placeholder="EXPECTED_RESPONSE" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display text-gray-600 uppercase tracking-[0.2em]">Partial Cipher (Hint)</label>
                      <input type="text" value={newPuzzle.hint} onChange={e => setNewPuzzle({ ...newPuzzle, hint: e.target.value })} className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs focus:border-green-800 italic" placeholder="OPTIONAL_DECRYPT_GUIDE" />
                    </div>
                    <button type="submit" className="border-[2px] border-black text-black bg-white hover:bg-[#fdfaf1] hover:text-black transition-colors p-2 font-display uppercase font-bold w-full h-12 bg-green-800 text-black font-bold text-xs tracking-[0.2em] border-none mt-4 hover:scale-[1.02] transition-transform">
                      COMMIT_LOGIC_UNIT
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.2)] pb-4 px-2">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Operational Metrics & Logic Export</h2>
                </div>
                <div className="flex gap-4">
                  <button onClick={exportTeamsCSV} className="border-[2px] border-black bg-white text-black hover:bg-[#fdfaf1] hover:text-black px-2 py-1 text-[9px] font-bold py-1.5 flex items-center gap-2">
                    <Download className="w-3 h-3" /> EXPORT_UNITS
                  </button>
                  <button onClick={exportSubmissionsCSV} className="border-[2px] border-black bg-white text-black hover:bg-[#fdfaf1] hover:text-black px-2 py-1 text-[9px] font-bold py-1.5 flex items-center gap-2">
                    <Download className="w-3 h-3" /> EXPORT_REPORTS
                  </button>
                </div>
              </div>

              <div className="paper-card p-10 border-orange-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <BarChart2 className="w-32 h-32 text-orange-500" />
                </div>
                <h3 className="text-sm font-display font-bold text-black uppercase tracking-[0.2em] mb-10 border-l-2 border-orange-500 pl-4">Task Resilience Index (Failure Rates)</h3>
                <div className="h-[450px] w-full">
                  {analytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis
                          dataKey="puzzle_id"
                          stroke="#444"
                          tick={{ fill: '#666', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                          tickFormatter={(val) => `UNIT_${val}`}
                          label={{ value: 'Task_Node_Address', position: 'insideBottom', offset: -10, fill: '#444', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                        />
                        <YAxis
                          stroke="#444"
                          tick={{ fill: '#666', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                          label={{ value: 'Failure_Count', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{ backgroundColor: '#050505', border: '1px solid #333', borderRadius: '0', fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color: '#ef4444', fontSize: '12px' }}
                          labelStyle={{ color: '#fff', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          formatter={(value: number) => [value, 'REJECTED_ATTEMPTS']}
                          labelFormatter={(label) => `Task Node 0x${parseInt(label).toString(16).toUpperCase()}`}
                        />
                        <Bar
                          dataKey="failed_attempts"
                          fill="#ef4444"
                          fillOpacity={0.8}
                          stroke="#ef4444"
                          strokeWidth={1}
                          radius={[0, 0, 0, 0]}
                          activeBar={{ fill: '#ef4444', fillOpacity: 1 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 font-display text-[10px] uppercase tracking-[0.5em] gap-6">
                      <div className="w-16 h-1 w-gray-400 bg-gray-900" />
                      Awaiting Investigative Data Stream...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.2)] pb-4 px-2">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xs font-display font-bold text-black uppercase tracking-[0.3em]">Global Score Event Log</h2>
                </div>
              </div>
              <div className="paper-card overflow-hidden border-cyan-400/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-display text-xs">
                    <thead className="bg-cyan-400/5 border-b border-cyan-400/20">
                      <tr>
                         <th className="p-4 text-gray-700 uppercase">Unit</th>
                         <th className="p-4 text-gray-700 uppercase">Event Type</th>
                         <th className="p-4 text-gray-700 uppercase">Points</th>
                         <th className="p-4 text-gray-700 uppercase">Metadata</th>
                         <th className="p-4 text-gray-700 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-400/20">
                      {events.map((e, i) => (
                        <tr key={i} className="hover:bg-[rgba(0,0,0,0.05)] text-gray-800">
                          <td className="p-4 font-bold">{e.team_name || `ID:${e.team_id}`}</td>
                          <td className="p-4 text-cyan-400">{e.event_type}</td>
                          <td className="p-4 tabular-nums text-green-800">{e.points > 0 ? `+${e.points}` : e.points}</td>
                          <td className="p-4 text-[10px] font-mono text-gray-600">{JSON.stringify(e.metadata)}</td>
                          <td className="p-4 text-gray-600">{new Date(e.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'multipliers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="paper-card p-8 border-yellow-400/40">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Deploy Economy Multiplier</h2>
                </div>
                <form onSubmit={handleActivateMultiplier} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-gray-600">Multiplier Value (e.g. 1.5, 2)</label>
                    <input name="multiplier" type="number" step="0.1" defaultValue="2" className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-gray-600">Duration (Minutes)</label>
                    <input name="durationMinutes" type="number" defaultValue="15" className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full" />
                  </div>
                  <button type="submit" className="border-[2px] border-black text-black bg-white hover:bg-[#fdfaf1] hover:text-black transition-colors p-2 font-display uppercase font-bold w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                    ACTIVATE MULTIPLIER
                  </button>
                </form>
              </div>

              <div className="paper-card p-8 border-[rgba(0,0,0,0.2)] overflow-y-auto max-h-[500px] custom-scrollbar">
                <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest mb-6">Multiplier History</h2>
                <div className="space-y-4">
                  {multipliers.map((m, i) => {
                     const isActive = new Date(m.ends_at) > new Date();
                     return (
                       <div key={i} className={`p-4 border ${isActive ? 'border-yellow-400 bg-yellow-400/10' : 'border-[rgba(0,0,0,0.2)] bg-gray-200 border-2 border-gray-400'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-yellow-400">{m.multiplier}x BOOST</span>
                            {isActive && <span className="text-[10px] px-2 border border-yellow-400 text-yellow-400 animate-pulse">LIVE</span>}
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono">
                            Ends: {new Date(m.ends_at).toLocaleString()}
                          </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adversary' && (
            <div className="space-y-8">
              {/* Config & Manual Trigger */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="paper-card p-8 border-red-500/40">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Crosshair className="w-5 h-5 text-red-500" />
                      <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Adversary Configuration</h2>
                    </div>
                    {adversaryConfig && (
                      <button 
                        onClick={() => handleUpdateAdversary({ is_active: !adversaryConfig.is_active })}
                        className={`text-xs px-3 py-1 border ${adversaryConfig.is_active ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-gray-500 text-gray-600'}`}
                      >
                        {adversaryConfig.is_active ? 'SYS: ONLINE' : 'SYS: OFFLINE'}
                      </button>
                    )}
                  </div>
                  
                  {adversaryConfig && (
                     <div className="space-y-6">
                       <div>
                         <label className="text-[10px] uppercase text-gray-600 block mb-2">Intensity Level</label>
                         <div className="flex gap-2">
                           {['low', 'medium', 'high'].map(level => (
                             <button
                               key={level}
                               onClick={() => handleUpdateAdversary({ intensity: level })}
                               className={`flex-1 py-2 text-xs uppercase transition-all ${adversaryConfig.intensity === level ? 'bg-red-500 text-black font-bold' : 'border border-[rgba(0,0,0,0.2)] text-gray-700'}`}
                             >
                               {level}
                             </button>
                           ))}
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] uppercase text-gray-600 block mb-2">Auto-Interference Lead Threshold</label>
                         <input 
                           type="number" 
                           value={adversaryConfig.lead_threshold} 
                           onChange={(e) => handleUpdateAdversary({ lead_threshold: parseInt(e.target.value) })}
                           className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs"
                         />
                       </div>
                     </div>
                  )}
                </div>

                <div className="paper-card p-8 border-red-500/40">
                  <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest mb-6">Manual Override (Target Unit)</h2>
                  <form onSubmit={handleTriggerAdversary} className="space-y-4">
                    <div>
                      <select name="targetTeamId" required className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full bg-[#fdfaf1] text-xs">
                         <option value="">SELECT TEAM...</option>
                         {teams.filter(t => !t.is_disabled).map(t => (
                           <option key={t.id} value={t.id}>{t.name} ({t.score} XP)</option>
                         ))}
                      </select>
                    </div>
                    <div>
                      <select name="actionType" required className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full bg-[#fdfaf1] text-xs">
                         <option value="signal_interference">VFX: Signal Interference (Glitch)</option>
                         <option value="guidance_hint">HELP: Guidance Hint (Banner)</option>
                         <option value="evidence_encrypt">ATTACK: Encrypt Evidence (De-Ice Cost)</option>
                      </select>
                    </div>
                    <div>
                      <input name="message" type="text" placeholder="Custom Message (Optional)..." className="border-b-2 border-black bg-transparent text-black p-2 font-display focus:outline-none focus:border-[#8b0000] placeholder-gray-500 w-full text-xs" />
                    </div>
                    <button type="submit" className="border-[2px] border-black text-black bg-white hover:bg-[#fdfaf1] hover:text-black transition-colors p-2 font-display uppercase font-bold w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-black">
                      EXECUTE OVERRIDE
                    </button>
                  </form>
                </div>
              </div>

              {/* Action Log */}
              <div className="paper-card overflow-hidden border-[rgba(0,0,0,0.2)]">
                 <div className="bg-[#fdfaf1]/80 px-6 py-4 border-b border-[rgba(0,0,0,0.2)]">
                    <h3 className="text-xs uppercase text-gray-700 tracking-widest font-bold">Adversary Deployment Log</h3>
                 </div>
                 <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left font-display text-xs">
                       <thead className="bg-white/5 border-b border-[rgba(0,0,0,0.2)]">
                          <tr>
                             <th className="p-4 text-gray-600">Target</th>
                             <th className="p-4 text-gray-600">Action Type</th>
                             <th className="p-4 text-gray-600">Resolved</th>
                             <th className="p-4 text-gray-600">Time</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-400/20">
                          {adversaryLog.map((log, i) => (
                             <tr key={i} className="text-gray-800 hover:bg-[rgba(0,0,0,0.05)]">
                                <td className="p-4 font-bold">{log.team_name || `ID:${log.target_team_id}`}</td>
                                <td className="p-4 text-red-400">{log.action_type}</td>
                                <td className="p-4">{log.resolved ? <span className="text-green-800">YES</span> : <span className="text-gray-600">NO</span>}</td>
                                <td className="p-4 text-[10px] text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


