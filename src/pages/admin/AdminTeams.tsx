import { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, Save, Edit2, Check } from 'lucide-react';
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

 if (loading) return <div className="text-[#a07830] font-display">Syncing Teams...</div>;

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-b border-[rgba(139,105,20,0.4)] pb-4">
 <div className="flex items-center gap-3">
 <Users className="w-5 h-5 text-[#a07830]" />
 <h2 className="text-sm font-display font-bold text-white uppercase tracking-[0.3em]">Unit Registry</h2>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
 <input
 type="text"
   id="team-search"
  name="team-search"
  placeholder="SEARCH_UNITS..."
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 className="w-64 pl-9 py-2 bg-black border border-[rgba(139,105,20,0.4)] text-xs font-mono text-white focus:border-[#a07830]"
 />
 </div>
 </div>

 <div className="border border-[#a07830]/20 bg-black/60">
 <table className="w-full text-left font-display text-xs">
 <thead className="bg-[#a07830]/5 border-b border-[#a07830]/20">
 <tr>
 <th className="p-4 text-gray-500 w-16">ID</th>
 <th className="p-4 text-gray-500">Callsign</th>
 <th className="p-4 text-gray-500">XP</th>
 <th className="p-4 text-gray-500">Status</th>
 <th className="p-4 text-right text-gray-500">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-cyber-line/20">
 {filteredTeams.map(t => (
 <tr key={t.id} className={`hover:bg-white/5 ${t.is_disabled ? 'opacity-50 grayscale' : ''}`}>
 <td className="p-4 text-gray-600">0x{t.id.toString(16).toUpperCase()}</td>
 <td className="p-4">
 {editingTeamId === t.id ? (
   <input id={`team-name-edit-${t.id}`} name={`team-name-edit-${t.id}`} type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-black border border-[#a07830] px-2 py-1 text-white w-full" />
 ) : <span className="text-white font-bold">{t.name}</span>}
 </td>
 <td className="p-4">
 {editingTeamId === t.id ? (
   <input id={`team-score-edit-${t.id}`} name={`team-score-edit-${t.id}`} type="number" value={editForm.score} onChange={e => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })} className="bg-black border border-[#d4a017] px-2 py-1 text-[#d4a017] w-24" />
 ) : <span className="text-[#d4a017] font-bold">{t.score.toLocaleString()} XP</span>}
 </td>
 <td className="p-4">
 {t.is_disabled ? <span className="text-[#A52A2A]">DISABLED</span> : <span className="text-[#d4a017]">ACTIVE</span>}
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2">
 {editingTeamId === t.id ? (
 <button onClick={() => handleSaveTeam(t.id)} className="p-2 border border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017] hover:text-black">
 <Save className="w-3 h-3" />
 </button>
 ) : (
 <button onClick={() => handleEditTeam(t)} className="p-2 border border-[rgba(139,105,20,0.4)] text-gray-500 hover:text-white">
 <Edit2 className="w-3 h-3" />
 </button>
 )}
 <button onClick={() => handleToggleDisable(t)} className="p-2 border border-[rgba(139,105,20,0.4)] text-gray-500 hover:text-white">
 {t.is_disabled ? <Check className="w-3 h-3 text-[#d4a017]" /> : <Ban className="w-3 h-3 text-[#A52A2A]" />}
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
