/**
 * Event Store — Event-Sourced Scoring Engine
 * 
 * Replaces mutable `teams.score` with an append-only event log.
 * Every point change is an immutable event. The score is a computed projection.
 */

import { supabase } from '../lib/supabase';
import crypto from 'crypto';

// Minimal Webhook helper (#8)
async function fireWebhook(type: string, message: string) {
 const url = process.env.DISCORD_WEBHOOK_URL;
 if (!url) return;
 try {
 await fetch(url, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content: `🚨 **${type}** 🚨\n${message}` })
 });
 } catch (e) { console.error('Webhook failed', e); }
}

export interface EventInput {
 teamId: number;
 eventType: string;
 basePoints: number;
 metadata?: Record<string, any>;
}

/**
 * Append a score event, check for active multipliers, compute final points,
 * and recompute the team's total score.
 */
const teamLocks = new Set<number>();

export async function appendEvent({ teamId, eventType, basePoints, metadata = {} }: EventInput): Promise<{ finalPoints: number; multiplierApplied: number | null }> {
  // Prevent concurrent recomputations for the same team on this instance
  while (teamLocks.has(teamId)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  teamLocks.add(teamId);

  try {
    // Integrity check: prevent duplicate first_blood or case_solve for the same target
    if (eventType === 'first_blood' || eventType === 'case_solve') {
      const targetId = metadata.case_id || metadata.puzzle_id;
      const { data: existing } = await supabase
        .from('score_events')
        .select('id')
        .eq('team_id', teamId)
        .eq('event_type', eventType)
        .filter(metadata.case_id ? 'metadata->>case_id' : 'metadata->>puzzle_id', 'eq', targetId)
        .limit(1)
        .single();
      
      if (existing) {
        return { finalPoints: 0, multiplierApplied: null };
      }
    }

    // Check for active multipliers that apply to this event type
    const now = new Date().toISOString();
    const { data: multipliers } = await supabase
      .from('score_multipliers')
      .select('*')
      .lte('starts_at', now)
      .gte('ends_at', now);

    let multiplierApplied: number | null = null;
    let finalPoints = basePoints;

    if (multipliers && multipliers.length > 0) {
      for (const m of multipliers) {
        // Check if this multiplier applies to this event type
        if (m.event_types && m.event_types.includes(eventType)) {
          finalPoints = Math.floor(basePoints * parseFloat(m.multiplier));
          multiplierApplied = parseFloat(m.multiplier);
          break; // Only apply the first matching multiplier
        }
      }
    }

    // Score Integrity Hashes (#4)
    const { data: lastEvent } = await supabase
      .from('score_events')
      .select('event_hash')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    const prev_hash = lastEvent?.event_hash || 'genesis';
    const event_hash = crypto.createHash('sha256')
      .update(`${prev_hash}|${teamId}|${eventType}|${finalPoints}|${now}`)
      .digest('hex');

    // Insert the event
    await supabase.from('score_events').insert([{
      team_id: teamId,
      event_type: eventType,
      points: finalPoints,
      prev_hash,
      event_hash,
      metadata: {
        ...metadata,
        base_points: basePoints,
        multiplier: multiplierApplied,
      }
    }]);

    // Webhooks (#8)
    if (eventType === 'first_blood') {
      fireWebhook('FIRST BLOOD', `Team ${teamId} just claimed first blood on ${metadata.case_id ? `Case ${metadata.case_id}` : `Puzzle ${metadata.puzzle_id}`}!`);
    } else if (eventType === 'case_solve') {
      fireWebhook('CASE SOLVED', `Team ${teamId} solved Case ${metadata.case_id}!`);
    }

    // Recompute team score from all events
    await recomputeTeamScore(teamId);

    return { finalPoints, multiplierApplied };
  } finally {
    teamLocks.delete(teamId);
  }
}

/**
 * Recompute a team's score from their event log.
 * This is the source of truth — the `teams.score` column is just a cache.
 */
export async function recomputeTeamScore(teamId: number): Promise<number> {
 const { data } = await supabase
 .from('score_events')
 .select('points')
 .eq('team_id', teamId);

 const total = data?.reduce((sum, e) => sum + e.points, 0) || 0;
 
 await supabase
 .from('teams')
 .update({ score: total })
 .eq('id', teamId);

 return total;
}

/**
 * Get the full event timeline for a specific team (for Profile page).
 */
export async function getTeamTimeline(teamId: number, limit = 50): Promise<any[]> {
 const { data } = await supabase
 .from('score_events')
 .select('*')
 .eq('team_id', teamId)
 .order('created_at', { ascending: false })
 .limit(limit);

 return data || [];
}

/**
 * Get the global event timeline across all teams (for Admin replay & Scoreboard feed).
 */
export async function getGlobalTimeline(limit = 30): Promise<any[]> {
 const { data } = await supabase
 .from('score_events')
 .select('*, teams(name)')
 .order('created_at', { ascending: false })
 .limit(limit);

 return data?.map((e: any) => ({
 ...e,
 team_name: e.teams?.name
 })) || [];
}

/**
 * Activate a score multiplier (admin only). Applies equally to ALL teams (fair).
 */
export async function activateMultiplier(
 multiplier: number,
 durationMinutes: number,
 eventTypes: string[] = ['puzzle_solve', 'case_solve']
): Promise<any> {
 const startsAt = new Date();
 const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

 const { data, error } = await supabase
 .from('score_multipliers')
 .insert([{
 multiplier,
 event_types: eventTypes,
 starts_at: startsAt.toISOString(),
 ends_at: endsAt.toISOString(),
 created_by: 'admin'
 }])
 .select()
 .single();

 if (error) throw error;
 return data;
}

/**
 * Get all multipliers (active and past).
 */
export async function getMultipliers(): Promise<any[]> {
 const { data } = await supabase
 .from('score_multipliers')
 .select('*')
 .order('created_at', { ascending: false });

 return data || [];
}

/**
 * Get currently active multipliers.
 */
export async function getActiveMultipliers(): Promise<any[]> {
 const now = new Date().toISOString();
 const { data } = await supabase
 .from('score_multipliers')
 .select('*')
 .lte('starts_at', now)
 .gte('ends_at', now);

 return data || [];
}

/**
 * Recompute ALL team scores from the event log (nuclear integrity check).
 */
export async function recomputeAllScores(): Promise<{ teamsUpdated: number }> {
 const { data: teams } = await supabase.from('teams').select('id');
 
 if (!teams) return { teamsUpdated: 0 };

 for (const team of teams) {
 await recomputeTeamScore(team.id);
 }

 return { teamsUpdated: teams.length };
}

/**
 * Event Replay & Snapshots (#5)
 */
export async function createGlobalSnapshot(): Promise<any> {
 const { data: teams } = await supabase.from('teams').select('id, name, score');
 const snapshot_hash = crypto.randomBytes(16).toString('hex');
 
 const { data } = await supabase.from('score_snapshots').insert([{
 snapshot_hash,
 state_data: { teams, timestamp: new Date().toISOString() },
 created_by: 'admin'
 }]).select().single();
 
 return data;
}

export async function getSnapshots(): Promise<any[]> {
 const { data } = await supabase.from('score_snapshots').select('*').order('created_at', { ascending: false });
 return data || [];
}
