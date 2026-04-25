import { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, Save, Edit2, Check, Shield } from 'lucide-react';
import { Team } from '../../types';
import { useSound } from '../../hooks/useSound';

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', score: 0 });
  const { playSound } = useSound();

  useEffect(() => {
    fetch('/api/admin/teams', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTeams(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEditTeam = (t: Team) => {
    playSound('click');
    setEditingTeamId(t.id);
    setEditForm({ name: t.name, score: t.score });
  };

  const handleSaveTeam = async (id: number) => {
    playSound('click');
    const res = await fetch(`/api/admin/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      playSound('success');
      setTeams(teams.map(t => t.id === id ? { ...t, ...editForm } : t));
      setEditingTeamId(null);
    } else {
      playSound('error');
    }
  };

  const handleToggleDisable = async (team: Team) => {
    playSound('click');
    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ name: team.name, score: team.score, is_disabled: !team.is_disabled })
    });
    if (res.ok) {
      playSound('success');
      setTeams(teams.map(t => t.id === team.id ? { ...t, is_disabled: !team.is_disabled } : t));
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <div className="text-[#d4a017] font-mono animate-pulse uppercase tracking-[0.4em]">Synchronizing Unit Data...</div>;

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// FIELD_UNIT_REGISTRY</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Unit <span className="text-[#d4a017]">Management</span>
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a07830]" />
          <input
            type="text"
            id="team-search"
            name="team-search"
            placeholder="SEARCH_UNITS..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-80 pl-12 pr-4 py-3 bg-[#140e06] border-2 border-[#3a2810] rounded-sm text-[10px] font-mono font-black text-[#f0d070] focus:border-[#d4a017]/50 tracking-widest outline-none uppercase placeholder:text-[#a07830]/20"
          />
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-[#140e06] border-2 border-[#3a2810] rounded-sm overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
          
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-[#0c0803] border-b-2 border-[#3a2810]">
              <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest w-24">Callsign ID</th>
              <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Unit Name</th>
              <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Efficiency (XP)</th>
              <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Deployment Status</th>
              <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a2810]/50">
            {filteredTeams.map(t => (
              <tr key={t.id} className={`group transition-all hover:bg-[#d4a017]/5 ${t.is_disabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <td className="p-6 font-mono text-[11px] text-[#a07830] font-black tracking-widest uppercase">
                  UNIT_{t.id.toString().padStart(3, '0')}
                </td>
                <td className="p-6">
                  {editingTeamId === t.id ? (
                    <input id={`team-name-edit-${t.id}`} name={`team-name-edit-${t.id}`} type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-black border-2 border-[#d4a017]/40 px-3 py-2 text-[#f4e6c4] font-black uppercase text-xs w-full focus:border-[#d4a017] outline-none" />
                  ) : <span className="text-[#f4e6c4] font-black uppercase tracking-tight text-sm group-hover:text-[#f0d070] transition-colors">{t.name}</span>}
                </td>
                <td className="p-6">
                  {editingTeamId === t.id ? (
                    <input id={`team-score-edit-${t.id}`} name={`team-score-edit-${t.id}`} type="number" value={editForm.score} onChange={e => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })} className="bg-black border-2 border-[#d4a017]/40 px-3 py-2 text-[#d4a017] font-black font-mono text-xs w-32 focus:border-[#d4a017] outline-none" />
                  ) : <span className="text-[#d4a017] font-black font-mono tracking-widest text-sm">{t.score.toLocaleString()} XP</span>}
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${t.is_disabled ? 'bg-red-900' : 'bg-[#d4a017] animate-pulse shadow-[0_0_8px_rgba(212,160,23,0.3)]'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.is_disabled ? 'text-red-900' : 'text-[#d4a017]'}`}>
                      {t.is_disabled ? 'DECOMMISSIONED' : 'ACTIVE_DUTY'}
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-3">
                    {editingTeamId === t.id ? (
                      <button onClick={() => handleSaveTeam(t.id)} className="p-3 bg-[#d4a017] text-black hover:bg-[#f0d070] transition-all shadow-lg border border-[#f0d070]">
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleEditTeam(t)} className="p-3 bg-[#2a1a0a] text-[#a07830] border border-[#3a2810] hover:text-[#d4a017] hover:border-[#d4a017]/40 transition-all shadow-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleToggleDisable(t)} className="p-3 bg-[#2a1a0a] text-[#a07830] border border-[#3a2810] hover:text-[#f4e6c4] hover:border-red-900/40 transition-all shadow-lg">
                      {t.is_disabled ? <Check className="w-4 h-4 text-green-600" /> : <Ban className="w-4 h-4 text-[#8B2020]" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-6 py-4 bg-[#0c0803] border-t-2 border-[#3a2810] flex items-center justify-between text-[8px] font-black text-[#a07830]/40 uppercase tracking-[0.3em] font-mono">
           <span>Registry Sync: Stable</span>
           <span>Unit Count: {filteredTeams.length}</span>
        </div>
      </div>
    </div>
  );
}
