import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, CheckCircle, XCircle, Clock, Search, Terminal, Key, Edit2, Save, Ban, Check, Plus, BarChart2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Submission, Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'answers' | 'teams' | 'builder' | 'analytics'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [masterKey, setMasterKey] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Team editing state
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{name: string, score: number, is_disabled: boolean}>({ name: '', score: 0, is_disabled: false });

  // Builder state
  const [newCase, setNewCase] = useState({ title: '', description: '', difficulty: 'Beginner', correct_attacker: '', points_on_solve: 100 });
  const [newEvidence, setNewEvidence] = useState({ case_id: '', type: 'chat', title: '', content: '', metadata: '', required_puzzle_id: '', linked_puzzles: '', linked_evidence: '' });
  const [newPuzzle, setNewPuzzle] = useState({ case_id: '', question: '', answer: '', points: 10, hint: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const [subRes, keyRes, teamsRes, analyticsRes] = await Promise.all([
          fetch('/api/admin/submissions', { headers }),
          fetch('/api/admin/master-key', { headers }),
          fetch('/api/admin/teams', { headers }),
          fetch('/api/admin/analytics', { headers })
        ]);
        
        if (subRes.ok && keyRes.ok && teamsRes.ok && analyticsRes.ok) {
          setSubmissions(await subRes.json());
          setMasterKey(await keyRes.json());
          setTeams(await teamsRes.json());
          setAnalytics(await analyticsRes.json());
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
    setEditingTeamId(team.id);
    setEditForm({ name: team.name, score: team.score, is_disabled: !!team.is_disabled });
  };

  const handleSaveTeam = async (id: number) => {
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
        setTeams(teams.map(t => t.id === id ? { ...t, ...editForm } : t));
        setEditingTeamId(null);
      }
    } catch (err) {
      console.error('Failed to update team');
    }
  };

  const handleToggleDisable = async (team: Team) => {
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
        setTeams(teams.map(t => t.id === team.id ? { ...t, is_disabled: newStatus } : t));
      }
    } catch (err) {
      console.error('Failed to toggle team status');
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newCase)
      });
      if (res.ok) {
        alert('Case created successfully');
        setNewCase({ title: '', description: '', difficulty: 'Beginner', correct_attacker: '', points_on_solve: 100 });
        // Refresh master key to get new case
        const keyRes = await fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (keyRes.ok) setMasterKey(await keyRes.json());
      }
    } catch (err) {
      alert('Failed to create case');
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedMetadata: any = {};
      if (newEvidence.metadata) {
        try {
          parsedMetadata = JSON.parse(newEvidence.metadata);
        } catch (err) {
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
        alert('Evidence added successfully');
        setNewEvidence({ case_id: '', type: 'chat', title: '', content: '', metadata: '', required_puzzle_id: '', linked_puzzles: '', linked_evidence: '' });
      }
    } catch (err) {
      alert('Failed to add evidence');
    }
  };

  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newPuzzle)
      });
      if (res.ok) {
        alert('Puzzle added successfully');
        setNewPuzzle({ case_id: '', question: '', answer: '', points: 10, hint: '' });
        const keyRes = await fetch('/api/admin/master-key', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (keyRes.ok) setMasterKey(await keyRes.json());
      }
    } catch (err) {
      alert('Failed to add puzzle');
    }
  };

  const exportTeamsCSV = () => {
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

  if (loading) return <div className="animate-pulse font-mono text-terminal-green">ACCESSING_RESTRICTED_DATABASE...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-tighter">CCU Command Center</h1>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Global Investigation Oversight</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/50 p-1 rounded border border-terminal-line">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded transition-colors ${
                activeTab === 'submissions' ? 'bg-terminal-green/20 text-terminal-green' : 'text-gray-500 hover:text-white'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded transition-colors flex items-center gap-2 ${
                activeTab === 'teams' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" /> Teams
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded transition-colors flex items-center gap-2 ${
                activeTab === 'answers' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Key className="w-3 h-3" /> Master Key
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded transition-colors flex items-center gap-2 ${
                activeTab === 'builder' ? 'bg-purple-500/20 text-purple-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Plus className="w-3 h-3" /> Builder
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded transition-colors flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" /> Analytics
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-terminal-green" />
                <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Recent Submissions</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                <input 
                  type="text"
                  placeholder="SEARCH..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="terminal-input pl-8 py-1 text-[10px] w-48"
                />
              </div>
            </div>
            
            <div className="terminal-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 border-b border-terminal-line/30">
                    <tr>
                      <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Team</th>
                      <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Case</th>
                      <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Suspect</th>
                      <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Status</th>
                      <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Time</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-line/10">
                    {filteredSubmissions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 text-white font-bold">{s.team_name}</td>
                        <td className="p-4 text-gray-400">{s.case_title}</td>
                        <td className="p-4 text-gray-400">{s.attacker_name}</td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 ${s.status === 'correct' ? 'text-terminal-green' : 'text-red-500'}`}>
                            {s.status === 'correct' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-[10px]">
                          {s.submitted_at ? new Date(s.submitted_at.replace(' ', 'T') + 'Z').toLocaleString() : 'UNKNOWN'}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedSubmission(s)}
                            className="text-terminal-green hover:underline uppercase tracking-widest text-[10px] font-bold"
                          >
                            View_Report
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Terminal className="w-4 h-4 text-terminal-green" />
              <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Report Analysis</h2>
            </div>
            
            <AnimatePresence mode="wait">
              {selectedSubmission ? (
                <motion.div 
                  key={selectedSubmission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="terminal-card p-6 space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-mono font-bold text-white uppercase tracking-tighter">
                      {selectedSubmission.team_name}
                    </h3>
                    <p className="text-[10px] font-mono text-terminal-green uppercase tracking-widest">
                      Case: {selectedSubmission.case_title}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Identified Suspect</h4>
                      <p className="text-sm font-mono text-white bg-white/5 p-2 rounded border border-white/10">
                        {selectedSubmission.attacker_name}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Methodology Analysis</h4>
                      <div className="text-xs font-mono text-gray-400 bg-white/5 p-3 rounded border border-white/10 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.attack_method}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Prevention Strategy</h4>
                      <div className="text-xs font-mono text-gray-400 bg-white/5 p-3 rounded border border-white/10 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.prevention_measures}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-terminal-line/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-[10px] font-mono text-gray-600 uppercase">
                        ID: {selectedSubmission.id}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedSubmission(null)}
                      className="text-[10px] font-mono text-gray-500 hover:text-white uppercase tracking-widest"
                    >
                      Close_Analysis
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="terminal-card p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <FileText className="w-12 h-12 text-gray-700" />
                  <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    Select a report from the list to begin analysis
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Team Management</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
              <input 
                type="text"
                placeholder="SEARCH TEAMS..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="terminal-input pl-8 py-1 text-[10px] w-48"
              />
            </div>
          </div>
          
          <div className="terminal-card overflow-hidden border-blue-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-blue-500/5 border-b border-blue-500/20">
                  <tr>
                    <th className="p-4 text-gray-500 uppercase tracking-widest font-bold w-16">ID</th>
                    <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Team Name</th>
                    <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Score</th>
                    <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Status</th>
                    <th className="p-4 text-gray-500 uppercase tracking-widest font-bold">Joined</th>
                    <th className="p-4 text-right text-gray-500 uppercase tracking-widest font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-line/10">
                  {filteredTeams.map((t) => (
                    <tr key={t.id} className={`hover:bg-white/5 transition-colors ${t.is_disabled ? 'opacity-50' : ''}`}>
                      <td className="p-4 text-gray-600">#{t.id}</td>
                      <td className="p-4">
                        {editingTeamId === t.id ? (
                          <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="bg-black border border-terminal-line text-white px-2 py-1 rounded text-xs w-full"
                          />
                        ) : (
                          <span className="text-white font-bold">{t.name}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {editingTeamId === t.id ? (
                          <input 
                            type="number" 
                            value={editForm.score}
                            onChange={(e) => setEditForm({...editForm, score: parseInt(e.target.value) || 0})}
                            className="bg-black border border-terminal-line text-terminal-green px-2 py-1 rounded text-xs w-20"
                          />
                        ) : (
                          <span className="text-terminal-green font-bold">{t.score} PTS</span>
                        )}
                      </td>
                      <td className="p-4">
                        {t.is_disabled ? (
                          <span className="text-red-500 flex items-center gap-1"><Ban className="w-3 h-3" /> DISABLED</span>
                        ) : (
                          <span className="text-terminal-green flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ACTIVE</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-[10px]">
                        {t.created_at ? new Date(t.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingTeamId === t.id ? (
                            <button 
                              onClick={() => handleSaveTeam(t.id)}
                              className="p-1.5 bg-terminal-green/20 text-terminal-green hover:bg-terminal-green hover:text-black rounded transition-colors"
                              title="Save Changes"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEditTeam(t)}
                              className="p-1.5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="Edit Team"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleDisable(t)}
                            className={`p-1.5 rounded transition-colors ${
                              t.is_disabled 
                                ? 'bg-terminal-green/10 text-terminal-green hover:bg-terminal-green hover:text-black' 
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                            title={t.is_disabled ? "Enable Team" : "Disable Team"}
                          >
                            {t.is_disabled ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
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
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Key className="w-4 h-4 text-yellow-500" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Master Answer Key (Classified)</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {masterKey.map((caseItem) => (
              <div key={caseItem.id} className="terminal-card overflow-hidden border-yellow-500/20">
                <div className="terminal-header bg-yellow-500/5 border-b border-yellow-500/20">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-mono font-bold text-yellow-500 uppercase tracking-widest">
                      Case #{caseItem.id}: {caseItem.title}
                    </span>
                    <span className="text-[10px] font-mono text-yellow-500/70 uppercase tracking-widest">
                      Final Answer: <strong className="text-yellow-400">{caseItem.correct_attacker}</strong> ({caseItem.points_on_solve} PTS)
                    </span>
                  </div>
                </div>
                <div className="p-0">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-black/40 border-b border-terminal-line/30">
                      <tr>
                        <th className="p-3 text-gray-500 uppercase tracking-widest font-bold w-16">ID</th>
                        <th className="p-3 text-gray-500 uppercase tracking-widest font-bold">Question</th>
                        <th className="p-3 text-yellow-500 uppercase tracking-widest font-bold">Answer</th>
                        <th className="p-3 text-gray-500 uppercase tracking-widest font-bold w-24">Points</th>
                        <th className="p-3 text-gray-500 uppercase tracking-widest font-bold">Hint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-terminal-line/10">
                      {caseItem.puzzles.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-gray-600">#{p.id}</td>
                          <td className="p-3 text-gray-300">{p.question}</td>
                          <td className="p-3 text-yellow-400 font-bold bg-yellow-500/5">{p.answer}</td>
                          <td className="p-3 text-terminal-green">{p.points} PTS</td>
                          <td className="p-3 text-gray-500 italic text-[10px]">{p.hint || 'No hint'}</td>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="terminal-card p-6 border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-purple-500" />
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Create New Case</h2>
              </div>
              <form onSubmit={handleCreateCase} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Case Title</label>
                  <input type="text" required value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Description</label>
                  <textarea required rows={3} value={newCase.description} onChange={e => setNewCase({...newCase, description: e.target.value})} className="terminal-input w-full text-xs resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Difficulty</label>
                    <select value={newCase.difficulty} onChange={e => setNewCase({...newCase, difficulty: e.target.value})} className="terminal-input w-full text-xs bg-black">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Hard</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Points</label>
                    <input type="number" required value={newCase.points_on_solve} onChange={e => setNewCase({...newCase, points_on_solve: parseInt(e.target.value) || 0})} className="terminal-input w-full text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Correct Attacker (Final Answer)</label>
                  <input type="text" required value={newCase.correct_attacker} onChange={e => setNewCase({...newCase, correct_attacker: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <button type="submit" className="w-full py-2 bg-purple-500/20 text-purple-500 hover:bg-purple-500 hover:text-white border border-purple-500/50 rounded text-xs font-mono font-bold uppercase transition-colors">
                  Initialize Case
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="terminal-card p-6 border-blue-500/30">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Add Evidence to Case</h2>
              </div>
              <form onSubmit={handleCreateEvidence} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Target Case</label>
                    <select required value={newEvidence.case_id} onChange={e => setNewEvidence({...newEvidence, case_id: e.target.value})} className="terminal-input w-full text-xs bg-black">
                      <option value="">Select Case...</option>
                      {masterKey.map(c => <option key={c.id} value={c.id}>#{c.id} - {c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Evidence Type</label>
                    <select required value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value})} className="terminal-input w-full text-xs bg-black">
                      <option value="chat">Chat Log</option>
                      <option value="html">HTML Source</option>
                      <option value="log">Server Log</option>
                      <option value="email">Email</option>
                      <option value="code">Source Code</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Evidence Title</label>
                  <input type="text" required value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Content (Raw Data)</label>
                  <textarea required rows={4} value={newEvidence.content} onChange={e => setNewEvidence({...newEvidence, content: e.target.value})} className="terminal-input w-full text-xs font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Metadata (JSON string)</label>
                    <input type="text" placeholder='{"server": "192.168.1.1"}' value={newEvidence.metadata} onChange={e => setNewEvidence({...newEvidence, metadata: e.target.value})} className="terminal-input w-full text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Required Puzzle ID (Optional Lock)</label>
                    <input type="number" value={newEvidence.required_puzzle_id} onChange={e => setNewEvidence({...newEvidence, required_puzzle_id: e.target.value})} className="terminal-input w-full text-xs" placeholder="Leave blank if unlocked" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Linked Puzzles (Comma-separated IDs)</label>
                    <input type="text" placeholder="e.g. 1, 2, 5" value={newEvidence.linked_puzzles} onChange={e => setNewEvidence({...newEvidence, linked_puzzles: e.target.value})} className="terminal-input w-full text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Linked Evidence (Comma-separated IDs)</label>
                    <input type="text" placeholder="e.g. 3, 4" value={newEvidence.linked_evidence} onChange={e => setNewEvidence({...newEvidence, linked_evidence: e.target.value})} className="terminal-input w-full text-xs font-mono" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/50 rounded text-xs font-mono font-bold uppercase transition-colors">
                  Upload Evidence
                </button>
              </form>
            </div>

            <div className="terminal-card p-6 border-terminal-green/30">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-terminal-green" />
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Add Puzzle to Case</h2>
              </div>
              <form onSubmit={handleCreatePuzzle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Target Case</label>
                    <select required value={newPuzzle.case_id} onChange={e => setNewPuzzle({...newPuzzle, case_id: e.target.value})} className="terminal-input w-full text-xs bg-black">
                      <option value="">Select Case...</option>
                      {masterKey.map(c => <option key={c.id} value={c.id}>#{c.id} - {c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Points Awarded</label>
                    <input type="number" required value={newPuzzle.points} onChange={e => setNewPuzzle({...newPuzzle, points: parseInt(e.target.value) || 0})} className="terminal-input w-full text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Question</label>
                  <input type="text" required value={newPuzzle.question} onChange={e => setNewPuzzle({...newPuzzle, question: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Exact Answer</label>
                  <input type="text" required value={newPuzzle.answer} onChange={e => setNewPuzzle({...newPuzzle, answer: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Hint (Optional)</label>
                  <input type="text" value={newPuzzle.hint} onChange={e => setNewPuzzle({...newPuzzle, hint: e.target.value})} className="terminal-input w-full text-xs" />
                </div>
                <button type="submit" className="w-full py-2 bg-terminal-green/20 text-terminal-green hover:bg-terminal-green hover:text-black border border-terminal-green/50 rounded text-xs font-mono font-bold uppercase transition-colors">
                  Deploy Puzzle
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Global Analytics & Export</h2>
            </div>
            <div className="flex gap-4">
              <button onClick={exportTeamsCSV} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded border border-blue-500/30 text-[10px] font-mono uppercase tracking-widest transition-colors">
                <Download className="w-3 h-3" /> Export Teams
              </button>
              <button onClick={exportSubmissionsCSV} className="flex items-center gap-2 px-3 py-1.5 bg-terminal-green/10 text-terminal-green hover:bg-terminal-green hover:text-black rounded border border-terminal-green/30 text-[10px] font-mono uppercase tracking-widest transition-colors">
                <Download className="w-3 h-3" /> Export Submissions
              </button>
            </div>
          </div>

          <div className="terminal-card p-6 border-orange-500/20">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-6">Puzzle Failure Rates (Most Difficult Puzzles)</h3>
            <div className="h-80 w-full">
              {analytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="puzzle_id" stroke="#666" tick={{ fill: '#666', fontSize: 12, fontFamily: 'monospace' }} tickFormatter={(val) => `P#${val}`} />
                    <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#ff4444' }}
                      labelStyle={{ color: '#fff', marginBottom: '4px' }}
                      formatter={(value: number, name: string) => [value, name === 'failed_attempts' ? 'Failed Attempts' : 'Total Attempts']}
                      labelFormatter={(label) => `Puzzle #${label}`}
                    />
                    <Bar dataKey="failed_attempts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                  No attempt data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

