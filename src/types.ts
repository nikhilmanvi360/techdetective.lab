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
}

export interface Case {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  correct_attacker?: string;
  points_on_solve: number;
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
  solved: boolean;
  hint_used: boolean;
  hint_used_at?: string;
}

export interface ScoreEntry {
  name: string;
  score: number;
}
