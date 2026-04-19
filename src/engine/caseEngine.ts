/**
 * Case Engine — Executable Case State Machine
 * 
 * Evaluates behavior rules defined on cases and maintains per-team state.
 * Rules can trigger auto-hints, lockouts, evidence mutations, and branch unlocks.
 */

import { supabase } from '../lib/supabase';

interface CaseTeamState {
  lockouts: Record<number, string>;      // puzzle_id -> lockout_until ISO
  dynamic_hints: Record<number, string>; // puzzle_id -> auto-hint text
  mutated_evidence: number[];            // evidence IDs with appended content
  unlocked_hidden: number[];             // hidden puzzle IDs unlocked
  encrypted_evidence: number[];          // evidence IDs blocked by Adversary
  messages: string[];                    // system messages to show the team
}

const DEFAULT_STATE: CaseTeamState = {
  lockouts: {},
  dynamic_hints: {},
  mutated_evidence: [],
  unlocked_hidden: [],
  encrypted_evidence: [],
  messages: []
};

/**
 * Get or create the team's state for a specific case.
 */
async function getOrCreateState(caseId: number, teamId: number): Promise<CaseTeamState> {
  const { data } = await supabase
    .from('case_team_state')
    .select('state')
    .eq('case_id', caseId)
    .eq('team_id', teamId)
    .single();

  if (data?.state) {
    return { ...DEFAULT_STATE, ...data.state };
  }

  // Create initial state
  await supabase.from('case_team_state').upsert([{
    case_id: caseId,
    team_id: teamId,
    state: DEFAULT_STATE,
    updated_at: new Date().toISOString()
  }], { onConflict: 'case_id,team_id' });

  return { ...DEFAULT_STATE };
}

/**
 * Save updated team state for a case.
 */
async function saveState(caseId: number, teamId: number, state: CaseTeamState): Promise<void> {
  await supabase.from('case_team_state').upsert([{
    case_id: caseId,
    team_id: teamId,
    state,
    updated_at: new Date().toISOString()
  }], { onConflict: 'case_id,team_id' });
}

/**
 * Evaluate behavior rules after a puzzle attempt.
 * Called from the puzzle solve endpoint.
 * 
 * Returns triggered messages for the client to display.
 */
export async function evaluatePostAttempt(
  caseId: number,
  teamId: number,
  puzzleId: number,
  isCorrect: boolean
): Promise<{ messages: string[]; stateChanged: boolean }> {
  // Fetch case behavior rules
  const { data: caseData } = await supabase
    .from('cases')
    .select('behavior')
    .eq('id', caseId)
    .single();

  const rules = caseData?.behavior || [];
  if (rules.length === 0) return { messages: [], stateChanged: false };

  const state = await getOrCreateState(caseId, teamId);
  const messages: string[] = [];
  let stateChanged = false;

  // Get attempt count for this puzzle by this team
  const { count: failedAttempts } = await supabase
    .from('puzzle_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('puzzle_id', puzzleId)
    .eq('is_correct', false);

  // Get solved puzzles for this team in this case
  const { data: puzzlesInCase } = await supabase
    .from('puzzles')
    .select('id')
    .eq('case_id', caseId);

  const puzzleIds = puzzlesInCase?.map(p => p.id) || [];

  const { data: solvedPuzzles } = await supabase
    .from('solved_puzzles')
    .select('puzzle_id, solved_at')
    .eq('team_id', teamId)
    .in('puzzle_id', puzzleIds);

  const solvedIds = new Set(solvedPuzzles?.map(p => p.puzzle_id) || []);

  for (const rule of rules) {
    try {
      switch (rule.type) {
        case 'auto_hint': {
          // Auto-reveal a hint after N failed attempts
          if (
            rule.trigger.event === 'failed_attempts' &&
            rule.trigger.puzzle_id === puzzleId &&
            !isCorrect &&
            (failedAttempts || 0) >= (rule.trigger.threshold || 5) &&
            !state.dynamic_hints[puzzleId]
          ) {
            // Fetch the puzzle's hint
            const { data: puzzle } = await supabase
              .from('puzzles')
              .select('hint')
              .eq('id', puzzleId)
              .single();

            if (puzzle?.hint) {
              state.dynamic_hints[puzzleId] = rule.action.message || puzzle.hint;
              messages.push(`🔓 SYSTEM: Auto-decrypting hint for Task ${puzzleId} after ${failedAttempts} failed attempts...`);
              stateChanged = true;
            }
          }
          break;
        }

        case 'puzzle_lockout': {
          // Temporarily lock a puzzle after too many wrong answers
          if (
            rule.trigger.event === 'failed_attempts' &&
            rule.trigger.puzzle_id === puzzleId &&
            !isCorrect &&
            (failedAttempts || 0) >= (rule.trigger.threshold || 5)
          ) {
            const lockoutSeconds = rule.action.duration_seconds || 60;
            const lockoutUntil = new Date(Date.now() + lockoutSeconds * 1000).toISOString();

            // Only apply if not already locked
            if (!state.lockouts[puzzleId] || new Date(state.lockouts[puzzleId]) < new Date()) {
              state.lockouts[puzzleId] = lockoutUntil;
              messages.push(`⚠️ FIREWALL: Task ${puzzleId} temporarily locked for ${lockoutSeconds}s — too many failed decryption attempts`);
              stateChanged = true;
            }
          }
          break;
        }

        case 'evidence_mutation': {
          // Append content to evidence when a puzzle is solved
          if (
            rule.trigger.event === 'puzzle_solved' &&
            rule.trigger.puzzle_id === puzzleId &&
            isCorrect &&
            rule.action.evidence_id &&
            !state.mutated_evidence.includes(rule.action.evidence_id)
          ) {
            state.mutated_evidence.push(rule.action.evidence_id);
            messages.push(rule.action.message || `📡 NEW INTEL: Evidence ${rule.action.evidence_id} has been updated with new data`);
            stateChanged = true;
          }
          break;
        }

        case 'branch_unlock': {
          // Unlock a hidden puzzle when specific puzzles are solved in order
          if (
            rule.trigger.event === 'solve_order' &&
            rule.trigger.puzzle_ids &&
            rule.action.unlock_puzzle_id &&
            !state.unlocked_hidden.includes(rule.action.unlock_puzzle_id)
          ) {
            const requiredOrder = rule.trigger.puzzle_ids;
            const allSolved = requiredOrder.every((pid: number) => solvedIds.has(pid));

            if (allSolved) {
              state.unlocked_hidden.push(rule.action.unlock_puzzle_id);
              messages.push(rule.action.message || `🔑 BRANCH UNLOCK: Hidden task ${rule.action.unlock_puzzle_id} is now accessible`);
              stateChanged = true;
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error(`Case engine rule evaluation error:`, e);
    }
  }

  if (stateChanged) {
    state.messages = [...state.messages, ...messages].slice(-20); // Keep last 20 messages
    await saveState(caseId, teamId, state);
  }

  return { messages, stateChanged };
}

/**
 * Get the current dynamic state for a case+team combo.
 * Used to overlay onto the GET /api/cases/:id response.
 */
export async function getCaseState(caseId: number, teamId: number): Promise<CaseTeamState> {
  const state = await getOrCreateState(caseId, teamId);

  // Clean up expired lockouts
  const now = new Date();
  let cleaned = false;
  for (const [puzzleId, lockoutUntil] of Object.entries(state.lockouts)) {
    if (new Date(lockoutUntil) < now) {
      delete state.lockouts[Number(puzzleId)];
      cleaned = true;
    }
  }

  if (cleaned) {
    await saveState(caseId, teamId, state);
  }

  return state;
}

/**
 * Get the appended content for a mutated evidence item.
 * Returns null if no mutation exists.
 */
export async function getMutatedContent(caseId: number, evidenceId: number): Promise<string | null> {
  const { data: caseData } = await supabase
    .from('cases')
    .select('behavior')
    .eq('id', caseId)
    .single();

  const rules = caseData?.behavior || [];
  
  for (const rule of rules) {
    if (rule.type === 'evidence_mutation' && rule.action.evidence_id === evidenceId) {
      return rule.action.append_content || null;
    }
  }

  return null;
}

export async function encryptEvidence(caseId: number, teamId: number, evidenceId: number): Promise<void> {
  const state = await getOrCreateState(caseId, teamId);
  if (!state.encrypted_evidence.includes(evidenceId)) {
    state.encrypted_evidence.push(evidenceId);
    state.messages.push(`🛑 ADVERSARY ALERT: Evidence node ${evidenceId} has been scrambled! Buy a De-Ice from the Shadow Market to restore it.`);
    await saveState(caseId, teamId, state);
  }
}

export async function decryptEvidence(caseId: number, teamId: number, evidenceId: number): Promise<void> {
  const state = await getOrCreateState(caseId, teamId);
  state.encrypted_evidence = state.encrypted_evidence.filter(id => id !== evidenceId);
  state.messages.push(`🟢 SYSTEM: Evidence node ${evidenceId} has been successfully decrypted and restored.`);
  await saveState(caseId, teamId, state);
}
