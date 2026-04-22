/**
 * Adversary AI — Engagement-Focused NPC System
 * 
 * The Adversary is NOT a punishment system. It's designed to:
 * - Guide struggling teams with helpful hints
 * - Keep the competition engaging with fun visual"attacks" (interference)
 * - Make the event more immersive and dynamic
 * 
 * Admin controls intensity and can manually trigger actions.
 * Players are beginners — the Adversary should HELP, not hinder.
 */

import { supabase } from '../lib/supabase';
import type { Server as SocketIOServer } from 'socket.io';
import { hasActiveShield, consumeShield } from './shopEngine';
import { encryptEvidence } from './caseEngine';

interface AdversaryConfig {
 is_active: boolean;
 intensity: 'low' | 'medium' | 'high';
 lead_threshold: number;
 actions_enabled: string[];
}

// Fun messages the Adversary sends to teams
const INTERFERENCE_MESSAGES = [
 '⚡ SIGNAL DETECTED: An unknown entity is probing your terminal...',
 '🔴 WARNING: Adversary breach attempt detected on your connection',
 '📡 ALERT: Rogue packet injection detected — Hold your ground!',
 '⚠️ SYSTEM: Digital phantom detected in your sector',
 '🛑 INTRUSION ALERT: Someone is watching your investigation...',
];

const GUIDANCE_MESSAGES: Record<string, string[]> = {
 low: [
 '💡 The Adversary whispers:"Look closer at the timestamps..."',
 '💡 The Adversary hints:"Not everything is as it seems in the logs..."',
 '💡 The Adversary suggests:"Have you tried reading between the lines?"',
 ],
 medium: [
 '🔍 The Adversary reveals:"Focus on the communication patterns..."',
 '🔍 The Adversary points:"The answer might be hidden in the metadata..."',
 '🔍 The Adversary guides:"Cross-reference the evidence files..."',
 ],
 high: [
 '🎯 The Adversary directs:"Check the source IPs in the server logs!"',
 '🎯 The Adversary reveals:"The chat history contains a coded message..."',
 '🎯 The Adversary assists:"Compare the email headers with the log timestamps!"',
 ],
};

/**
 * Get the current adversary configuration.
 */
export async function getConfig(): Promise<AdversaryConfig | null> {
 const { data } = await supabase
 .from('adversary_config')
 .select('*')
 .limit(1)
 .single();

 return data;
}

/**
 * Update adversary configuration.
 */
export async function updateConfig(config: Partial<AdversaryConfig>): Promise<void> {
 const { data: existing } = await supabase
 .from('adversary_config')
 .select('id')
 .limit(1)
 .single();

 if (existing) {
 await supabase
 .from('adversary_config')
 .update({ ...config, updated_at: new Date().toISOString() })
 .eq('id', existing.id);
 } else {
 await supabase
 .from('adversary_config')
 .insert([{ ...config }]);
 }
}

/**
 * Evaluate whether the Adversary should take action after a score change.
 * Called after every score update.
 * 
 * The Adversary is engagement-focused:
 * - For the LEADER: fun visual interference (not penalizing)
 * - For STRUGGLING teams: guidance hints to help them progress
 */
export async function evaluateAdversary(io: SocketIOServer): Promise<void> {
 const config = await getConfig();
 if (!config || !config.is_active) return;

 // Get all team scores
 const { data: teams } = await supabase
 .from('teams')
 .select('id, name, score')
 .eq('is_disabled', false)
 .order('score', { ascending: false });

 if (!teams || teams.length < 2) return;

 const leader = teams[0];
 const lastPlace = teams[teams.length - 1];
 const scoreDiff = leader.score - (teams[1]?.score || 0);

 // Throttle: check if we've acted recently (don't spam)
 const { count: recentActions } = await supabase
 .from('adversary_actions')
 .select('*', { count: 'exact', head: true })
 .gte('created_at', new Date(Date.now() - 3 * 60 * 1000).toISOString()); // Last 3 minutes

 const maxActionsPerWindow = config.intensity === 'low' ? 1 : config.intensity === 'medium' ? 2 : 3;
 if ((recentActions || 0) >= maxActionsPerWindow) return;

 // ACTION 1: Signal interference on leader (fun, not penalizing)
 if (
 config.actions_enabled.includes('signal_interference') &&
 scoreDiff >= config.lead_threshold
 ) {
 await executeAction(io, leader.id, leader.name, 'signal_interference', {
 message: INTERFERENCE_MESSAGES[Math.floor(Math.random() * INTERFERENCE_MESSAGES.length)],
 duration_ms: config.intensity === 'low' ? 3000 : config.intensity === 'medium' ? 5000 : 8000,
 });
 }

 // ACTION 2: Guidance hints for the struggling team
 if (
 config.actions_enabled.includes('guidance_hint') &&
 lastPlace.score < leader.score * 0.5 // Struggling = less than half the leader's score
 ) {
 const hints = GUIDANCE_MESSAGES[config.intensity] || GUIDANCE_MESSAGES.low;
 const hint = hints[Math.floor(Math.random() * hints.length)];

 await executeAction(io, lastPlace.id, lastPlace.name, 'guidance_hint', {
 message: hint,
 helpful: true,
 });
 }
}

/**
 * Execute an adversary action — log it and emit via Socket.IO.
 */
async function executeAction(
 io: SocketIOServer,
 targetTeamId: number,
 targetTeamName: string,
 actionType: string,
 metadata: Record<string, any>
): Promise<void> {
 // Check for active Data Shield
 if (actionType !== 'guidance_hint') {
 const hasShield = await hasActiveShield(targetTeamId);
 if (hasShield) {
 await consumeShield(targetTeamId);
 io.emit('live_event', {
 message: `🛡️ SHIELD ACTIVE:"${targetTeamName}" absorbed an Adversary attack!`,
 type: 'badge',
 timestamp: new Date().toISOString()
 });
 return;
 }
 }

 // Log the action
 await supabase.from('adversary_actions').insert([{
 target_team_id: targetTeamId,
 action_type: actionType,
 metadata,
 }]);

 // Execute actual mechanics if applicable
 if (actionType === 'evidence_encrypt' && metadata.case_id && metadata.evidence_id) {
 await encryptEvidence(metadata.case_id, targetTeamId, metadata.evidence_id);
 }

 // Emit to all clients — they filter by their own team ID
 io.emit('adversary_action', {
 target_team_id: targetTeamId,
 target_team_name: targetTeamName,
 action_type: actionType,
 metadata,
 timestamp: new Date().toISOString(),
 });

 // Also emit as a live event for spectacle
 if (actionType === 'signal_interference') {
 io.emit('live_event', {
 message: `⚡ The Adversary has targeted ${targetTeamName}!`,
 type: 'case',
 timestamp: new Date().toISOString(),
 });
 } else if (actionType === 'guidance_hint') {
 io.emit('live_event', {
 message: `💡 The Adversary is offering guidance to ${targetTeamName}...`,
 type: 'badge',
 timestamp: new Date().toISOString(),
 });
 }
}

/**
 * Manually trigger an adversary action (admin use).
 */
export async function manualTrigger(
 io: SocketIOServer,
 targetTeamId: number,
 actionType: string,
 customMessage?: string
): Promise<void> {
 const { data: team } = await supabase
 .from('teams')
 .select('name')
 .eq('id', targetTeamId)
 .single();

 if (!team) return;

 const metadata: Record<string, any> = { manual: true };

 if (actionType === 'signal_interference') {
 metadata.message = customMessage || INTERFERENCE_MESSAGES[Math.floor(Math.random() * INTERFERENCE_MESSAGES.length)];
 metadata.duration_ms = 5000;
 } else if (actionType === 'guidance_hint') {
 metadata.message = customMessage || '💡 The Adversary offers a clue:"Think about what connects the evidence..."';
 metadata.helpful = true;
 } else if (actionType === 'evidence_encrypt') {
 // Target a specific piece of evidence for the team
 const { data: cases } = await supabase.from('cases').select('id').limit(1);
 const caseId = cases?.[0]?.id || 1;
 const { data: evidence } = await supabase.from('evidence').select('id').eq('case_id', caseId).limit(5);
 const evidenceId = evidence?.[Math.floor(Math.random() * (evidence?.length || 1))]?.id || 1;

 metadata.case_id = caseId;
 metadata.evidence_id = evidenceId;
 metadata.message = customMessage || `🔒 The Adversary has scrambled Evidence #${evidenceId}. Restore it from the Shadow Market!`;
 metadata.cost_to_resolve = 80; // Cost of Evidence Decrypter
 }

 await executeAction(io, targetTeamId, team.name, actionType, metadata);
}

/**
 * Resolve an adversary action (team pays points to clear it).
 */
export async function resolveAction(actionId: number, teamId: number): Promise<{ success: boolean; cost: number }> {
 const { data: action } = await supabase
 .from('adversary_actions')
 .select('*')
 .eq('id', actionId)
 .eq('target_team_id', teamId)
 .eq('resolved', false)
 .single();

 if (!action) return { success: false, cost: 0 };

 const cost = action.metadata?.cost_to_resolve || 25;

 // Mark as resolved
 await supabase
 .from('adversary_actions')
 .update({ resolved: true })
 .eq('id', actionId);

 return { success: true, cost };
}

/**
 * Get active (unresolved) adversary actions for a team.
 */
export async function getTeamActions(teamId: number): Promise<any[]> {
 const { data } = await supabase
 .from('adversary_actions')
 .select('*')
 .eq('target_team_id', teamId)
 .eq('resolved', false)
 .order('created_at', { ascending: false });

 return data || [];
}

/**
 * Get full adversary action log (admin view).
 */
export async function getActionLog(limit = 50): Promise<any[]> {
 const { data } = await supabase
 .from('adversary_actions')
 .select('*, teams(name)')
 .order('created_at', { ascending: false })
 .limit(limit);

 return data?.map((a: any) => ({
 ...a,
 team_name: a.teams?.name
 })) || [];
}
