-- Tech Detective Supabase Schema (PostgreSQL)

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  correct_attacker TEXT,
  points_on_solve INTEGER DEFAULT 100
);

-- Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  hint TEXT
);

-- Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'chat', 'html', 'log', 'email', 'code'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- JSON storage for extra info
  required_puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE SET NULL
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  attacker_name TEXT NOT NULL,
  attack_method TEXT NOT NULL,
  prevention_measures TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'correct', 'incorrect'
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Solved Puzzles Junction
CREATE TABLE IF NOT EXISTS solved_puzzles (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  solved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, puzzle_id)
);

-- Used Hints Junction
CREATE TABLE IF NOT EXISTS used_hints (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, puzzle_id)
);

-- Puzzle Attempts Log
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Team Badges Table
CREATE TABLE IF NOT EXISTS team_badges (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_score(team_id_input INT, points_input INT)
RETURNS VOID AS $$
BEGIN
  UPDATE teams
  SET score = score + points_input
  WHERE id = team_id_input;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EVENT SOURCING: Immutable score event log
-- ============================================================

CREATE TABLE IF NOT EXISTS score_events (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'puzzle_solve', 'case_solve', 'first_blood', 'hint_penalty', 'admin_adjust', 'adversary_action'
  points INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Active multiplier windows (admin-controlled, fair for all teams)
CREATE TABLE IF NOT EXISTS score_multipliers (
  id SERIAL PRIMARY KEY,
  multiplier NUMERIC(3,1) NOT NULL DEFAULT 2.0,
  event_types TEXT[] DEFAULT ARRAY['puzzle_solve', 'case_solve'],
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Recompute a team's score from their event log (anti-cheat / integrity check)
CREATE OR REPLACE FUNCTION recompute_team_score(target_team_id INT)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total
  FROM score_events
  WHERE team_id = target_team_id;

  UPDATE teams SET score = total WHERE id = target_team_id;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EXECUTABLE CASE ENGINE: Behavior rules + per-team state
-- ============================================================

-- Add behavior rules column to cases (JSONB array of rules)
-- Run: ALTER TABLE cases ADD COLUMN IF NOT EXISTS behavior JSONB DEFAULT '[]';

-- Per-team case state (lockouts, dynamic hints, mutations)
CREATE TABLE IF NOT EXISTS case_team_state (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{"lockouts":{},"dynamic_hints":{},"mutated_evidence":[],"unlocked_hidden":[],"messages":[]}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, team_id)
);

-- ============================================================
-- ADVERSARY AI: Engagement-focused NPC system
-- ============================================================

-- Adversary configuration (admin-controlled)
CREATE TABLE IF NOT EXISTS adversary_config (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  intensity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  lead_threshold INTEGER DEFAULT 200,
  actions_enabled TEXT[] DEFAULT ARRAY['signal_interference', 'guidance_hint'],
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Adversary action log
CREATE TABLE IF NOT EXISTS adversary_actions (
  id SERIAL PRIMARY KEY,
  target_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'signal_interference', 'evidence_encrypt', 'puzzle_scramble', 'guidance_hint'
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default adversary config
INSERT INTO adversary_config (is_active, intensity, lead_threshold, actions_enabled)
VALUES (false, 'low', 200, ARRAY['signal_interference', 'guidance_hint'])
ON CONFLICT DO NOTHING;

-- Investigation Board Tables
CREATE TABLE IF NOT EXISTS investigation_nodes (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'suspect', 'clue', 'timeline'
  content JSONB NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investigation_links (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  source_node_id INTEGER NOT NULL REFERENCES investigation_nodes(id) ON DELETE CASCADE,
  target_node_id INTEGER NOT NULL REFERENCES investigation_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

