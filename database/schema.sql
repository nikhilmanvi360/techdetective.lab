-- Tech Detective Supabase Schema (PostgreSQL)
-- Implements RLS, transactional integrity, and hardened constraints.

-- ============================================================
-- EXTENSIONS & SETTINGS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Protected by RLS
  role TEXT NOT NULL DEFAULT 'detective' CHECK (role IN ('detective', 'analyst', 'hacker', 'admin')),
  score INTEGER DEFAULT 0,
  is_disabled BOOLEAN DEFAULT FALSE,
  token_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Intermediate', 'Hard', 'Dynamic')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'solved', 'locked')),
  correct_attacker TEXT,
  points_on_solve INTEGER DEFAULT 100,
  behavior JSONB DEFAULT '[]'
);

-- Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  hint TEXT,
  depends_on_puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE SET NULL
);

-- Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chat', 'html', 'log', 'email', 'code')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  required_puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE SET NULL,
  unlock_at TIMESTAMPTZ
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  attacker_name TEXT NOT NULL,
  attack_method TEXT NOT NULL,
  prevention_measures TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect')),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- JUNCTIONS & LOGS
-- ============================================================

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

-- ============================================================
-- SCORING & EVENT SOURCING
-- ============================================================

-- Immutable score event log
CREATE TABLE IF NOT EXISTS score_events (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  event_hash TEXT,
  prev_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots
CREATE TABLE IF NOT EXISTS score_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_hash TEXT NOT NULL,
  state_data JSONB NOT NULL,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Multipliers
CREATE TABLE IF NOT EXISTS score_multipliers (
  id SERIAL PRIMARY KEY,
  multiplier NUMERIC(3,1) NOT NULL DEFAULT 2.0,
  event_types TEXT[] DEFAULT ARRAY['puzzle_solve', 'case_solve'],
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ENGINE & STATE
-- ============================================================

CREATE TABLE IF NOT EXISTS case_team_state (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{"lockouts":{},"dynamic_hints":{},"mutated_evidence":[],"unlocked_hidden":[],"messages":[]}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, team_id)
);

CREATE TABLE IF NOT EXISTS adversary_config (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  intensity TEXT DEFAULT 'low' CHECK (intensity IN ('low', 'medium', 'high')),
  lead_threshold INTEGER DEFAULT 200,
  actions_enabled TEXT[] DEFAULT ARRAY['signal_interference', 'guidance_hint'],
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adversary_actions (
  id SERIAL PRIMARY KEY,
  target_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INVESTIGATION TOOLS
-- ============================================================

CREATE TABLE IF NOT EXISTS investigation_nodes (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('suspect', 'clue', 'timeline')),
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

CREATE TABLE IF NOT EXISTS game_rooms (
  id SERIAL PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  host_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Round 1 State & Evidence
CREATE TABLE IF NOT EXISTS round1_state (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  points_value INTEGER DEFAULT 50,
  flavor_text TEXT,
  reveal_delay_seconds INTEGER DEFAULT 5,
  claimed_by_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ
);

-- Round 3 State
CREATE TABLE IF NOT EXISTS round3_state (
  id SERIAL PRIMARY KEY,
  current_phase TEXT DEFAULT 'A',
  is_active BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE round3_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Round 1 state viewable by all" ON round1_state FOR SELECT USING (true);
CREATE POLICY "Evidence codes viewable by all" ON evidence_codes FOR SELECT USING (true);
CREATE POLICY "Round 3 state viewable by all" ON round3_state FOR SELECT USING (true);

-- ============================================================
-- TRIGGERS: Integrity & Automated Cache
-- ============================================================

-- Function to recompute score and cache it in teams table
CREATE OR REPLACE FUNCTION trigger_recompute_team_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams
  SET score = (
    SELECT COALESCE(SUM(points), 0)
    FROM score_events
    WHERE team_id = NEW.team_id
  )
  WHERE id = NEW.team_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger score recompute on event log change
CREATE TRIGGER trg_recompute_score
AFTER INSERT OR DELETE OR UPDATE ON score_events
FOR EACH ROW EXECUTE FUNCTION trigger_recompute_team_score();

-- Function to prevent score_events mutation (Append-Only)
CREATE OR REPLACE FUNCTION protect_score_events()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Score events are immutable and cannot be updated.';
  END IF;
  IF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'Score events are immutable and cannot be deleted.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_score_events
BEFORE UPDATE OR DELETE ON score_events
FOR EACH ROW EXECUTE FUNCTION protect_score_events();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS for all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solved_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_team_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE adversary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE adversary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_links ENABLE ROW LEVEL SECURITY;

-- 1. Public / Common Access Policies
CREATE POLICY "Cases are viewable by everyone" ON cases FOR SELECT USING (true);
CREATE POLICY "Puzzles are viewable by everyone" ON puzzles FOR SELECT USING (true);
CREATE POLICY "Evidence is viewable by everyone" ON evidence FOR SELECT USING (true);
CREATE POLICY "Multipliers are viewable by everyone" ON score_multipliers FOR SELECT USING (true);

-- 2. Team-Specific Access Policies (Teams can only see their own data)
CREATE POLICY "Teams see their own profile" ON teams FOR SELECT USING (id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams cannot see other team passwords" ON teams FOR SELECT USING (id = auth.uid() OR role = 'admin');

CREATE POLICY "Teams see their own submissions" ON submissions FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams create their own submissions" ON submissions FOR INSERT WITH CHECK (team_id = auth.uid());

CREATE POLICY "Teams see their solved puzzles" ON solved_puzzles FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their used hints" ON used_hints FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their attempts" ON puzzle_attempts FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their badges" ON team_badges FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their score events" ON score_events FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their case state" ON case_team_state FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their nodes" ON investigation_nodes FOR SELECT USING (team_id = auth.uid() OR role = 'admin');
CREATE POLICY "Teams see their links" ON investigation_links FOR SELECT USING (team_id = auth.uid() OR role = 'admin');

-- 3. Admin Access Policies
CREATE POLICY "Admins have full access to everything" ON teams USING (role = 'admin');
CREATE POLICY "Admins manage cases" ON cases USING (role = 'admin');
CREATE POLICY "Admins manage puzzles" ON puzzles USING (role = 'admin');
CREATE POLICY "Admins manage evidence" ON evidence USING (role = 'admin');
CREATE POLICY "Admins view all submissions" ON submissions FOR SELECT USING (role = 'admin');
CREATE POLICY "Admins manage snapshots" ON score_snapshots USING (role = 'admin');
CREATE POLICY "Admins manage config" ON adversary_config USING (role = 'admin');
CREATE POLICY "Admins manage multipliers" ON score_multipliers USING (role = 'admin');

-- 4. System / Service Level Access (Override for internal logic if needed)
-- (Supabase "service_role" usually bypasses RLS, which is used by our server.ts)

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- ============================================================
-- TRANSACTIONAL RPCs (Atomic Operations)
-- ============================================================

-- Atomic Puzzle Solve
CREATE OR REPLACE FUNCTION solve_puzzle_v2(
  p_team_id INTEGER,
  p_puzzle_id INTEGER,
  p_base_points INTEGER,
  p_case_id INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_already_solved BOOLEAN;
  v_points_awarded INTEGER;
BEGIN
  -- 1. Check if already solved (FOR UPDATE for row locking)
  SELECT EXISTS (
    SELECT 1 FROM solved_puzzles 
    WHERE team_id = p_team_id AND puzzle_id = p_puzzle_id
    FOR UPDATE
  ) INTO v_already_solved;

  IF v_already_solved THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already solved');
  END IF;

  -- 2. Record solve
  INSERT INTO solved_puzzles (team_id, puzzle_id) VALUES (p_team_id, p_puzzle_id);

  -- 3. Append score event
  -- Note: trigger_recompute_team_score will update the team's score cache
  INSERT INTO score_events (team_id, event_type, points, metadata)
  VALUES (p_team_id, 'puzzle_solve', p_base_points, jsonb_build_object('puzzle_id', p_puzzle_id, 'case_id', p_case_id));

  RETURN jsonb_build_object('success', true, 'points', p_base_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Shop Purchase
CREATE OR REPLACE FUNCTION purchase_item_v2(
  p_team_id INTEGER,
  p_cost INTEGER,
  p_item_type TEXT,
  p_item_id INTEGER,
  p_case_id INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_current_score INTEGER;
BEGIN
  -- 1. Get current score with lock
  SELECT score INTO v_current_score FROM teams WHERE id = p_team_id FOR UPDATE;

  IF v_current_score < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- 2. Subtract points via negative score event
  INSERT INTO score_events (team_id, event_type, points, metadata)
  VALUES (p_team_id, 'shop_purchase', -p_cost, jsonb_build_object(
    'item_type', p_item_type,
    'item_id', p_item_id,
    'case_id', p_case_id
  ));

  RETURN jsonb_build_object('success', true, 'new_score', v_current_score - p_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO round1_state (id, is_active) VALUES (1, true) ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active;
INSERT INTO round3_state (id, is_active, current_phase) VALUES (1, true, 'A') ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active;

INSERT INTO evidence_codes (code, title, content, category, points_value, flavor_text) VALUES 
('K_SEHGAL', 'Simulation Anomaly', 'Unauthorized signal trace detected from unit 8080. Potential rehearsal of a major operational event.', 'network', 100, 'The breadcrumbs lead to a single node.'),
('VAULT_KEYS', 'Credential Extraction', 'Memory dump shows extraction of keys associated with the central repository.', 'data', 150, 'They were looking for something specific.'),
('SYSTEM_ROOT', 'Audit Log Purge', 'A script was executed to wipe all audit trails between 11:00 PM and 12:00 AM.', 'system', 200, 'Someone is covering their tracks.');
