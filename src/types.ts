export interface Badge {
 badge_name: string;
 earned_at: string;
}

export interface Team {
 id: number;
 name: string;
 score: number;
 created_at?: string;
 is_disabled?: boolean;
 badges?: Badge[];
 role?: 'detective' | 'analyst' | 'admin';
}

export interface Case {
 id: string;
 title: string;
 description: string;
 difficulty: 'Easy' | 'Intermediate' | 'Hard' | 'Expert';
 status: 'active' | 'solved' | 'locked';
 points_on_solve: number;
 points?: number;
 round?: string;
 correct_attacker?: string;
 metadata?: any;
}

export interface Submission {
 id: number;
 team_id: number;
 case_id: number;
 attacker_name: string;
 attack_method: string;
 prevention_measures: string;
 status: 'pending' | 'correct' | 'incorrect';
 feedback?: string;
 submitted_at: string;
 team_name?: string;
 case_title?: string;
}

export interface Evidence {
 id: number;
 case_id: number;
 type: 'chat' | 'html' | 'log' | 'email' | 'code';
 title: string;
 content: string;
 metadata?: string;
 required_puzzle_id?: number;
 is_locked: boolean;
}

export interface Puzzle {
 id: number;
 case_id: number;
 question: string;
 points: number;
 answer: string;
 hint?: string;
 has_hint: boolean;
 solved: boolean;
 hint_used: boolean;
 hint_used_at?: string;
 is_purchased_hint?: boolean;
}

export interface ScoreEntry {
 name: string;
 score: number;
}

// === Event Sourcing ===

export interface ScoreEvent {
 id: number;
 team_id: number;
 event_type: 'puzzle_solve' | 'case_solve' | 'first_blood' | 'hint_penalty' | 'admin_adjust' | 'adversary_action';
 points: number;
 metadata: Record<string, any>;
 created_at: string;
 team_name?: string;
}

export interface ScoreMultiplier {
 id: number;
 multiplier: number;
 event_types: string[];
 starts_at: string;
 ends_at: string;
 created_by: string;
 created_at: string;
}

// === Executable Case Engine ===

export interface CaseBehaviorRule {
 type: 'auto_hint' | 'evidence_mutation' | 'puzzle_lockout' | 'branch_unlock';
 trigger: {
 event: 'failed_attempts' | 'puzzle_solved' | 'solve_order';
 puzzle_id?: number;
 threshold?: number;
 puzzle_ids?: number[];
 };
 action: {
 puzzle_id?: number;
 evidence_id?: number;
 duration_seconds?: number;
 message?: string;
 unlock_puzzle_id?: number;
 append_content?: string;
 };
}

export interface CaseTeamState {
 lockouts: Record<number, string>; // puzzle_id -> lockout_until ISO string
 dynamic_hints: Record<number, string>; // puzzle_id -> auto-revealed hint
 mutated_evidence: number[]; // evidence IDs that have been mutated
 unlocked_hidden: number[]; // hidden puzzle IDs unlocked by branch rules
 messages: string[]; // system messages to display
}

// === Adversary AI ===

export interface AdversaryConfig {
 id: number;
 is_active: boolean;
 intensity: 'low' | 'medium' | 'high';
 lead_threshold: number;
 actions_enabled: string[];
 updated_at: string;
}

export interface AdversaryAction {
 id: number;
 target_team_id: number;
 action_type: 'signal_interference' | 'evidence_encrypt' | 'puzzle_scramble' | 'guidance_hint';
 metadata: Record<string, any>;
 resolved: boolean;
 created_at: string;
 team_name?: string;
}
