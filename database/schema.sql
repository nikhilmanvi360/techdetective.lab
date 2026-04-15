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
