-- ============================================================
-- ROUND 1: The Living Crime Scene — Schema Migration
-- Run this in Supabase SQL editor BEFORE seeding
-- ============================================================

-- Evidence codes table (one row per physical QR card)
CREATE TABLE IF NOT EXISTS evidence_codes (
  id                   SERIAL PRIMARY KEY,
  code                 TEXT UNIQUE NOT NULL,         -- e.g. "EC-A1B2"
  title                TEXT NOT NULL,
  content              TEXT NOT NULL,                -- Full revealed text
  category             TEXT NOT NULL CHECK (category IN ('clue', 'witness', 'document', 'red_herring')),
  points_value         INTEGER NOT NULL DEFAULT 100,
  flavor_text          TEXT,                         -- Physical placement hint for admin
  claimed_by_team_id   INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  claimed_at           TIMESTAMPTZ,
  is_active            BOOLEAN DEFAULT TRUE,
  reveal_delay_seconds INTEGER DEFAULT 3,            -- Countdown before content reveals
  created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Round 1 global state (single row, admin-controlled)
CREATE TABLE IF NOT EXISTS round1_state (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  is_active        BOOLEAN DEFAULT FALSE,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 20
);

-- Insert default state if not exists
INSERT INTO round1_state (id, is_active)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_evidence_codes_code ON evidence_codes(code);
CREATE INDEX IF NOT EXISTS idx_evidence_codes_claimed ON evidence_codes(claimed_by_team_id);

-- ============================================================
-- ROUND 1 → ROUND 2 CARRY-FORWARD VIEW
-- Returns all evidence a team claimed in Round 1
-- ============================================================
CREATE OR REPLACE VIEW team_r1_evidence AS
  SELECT
    ec.claimed_by_team_id AS team_id,
    ec.code,
    ec.category,
    ec.title,
    ec.points_value,
    ec.claimed_at
  FROM evidence_codes ec
  WHERE ec.claimed_by_team_id IS NOT NULL
  ORDER BY ec.claimed_at ASC;
