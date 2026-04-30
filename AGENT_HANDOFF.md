# AGENT HANDOFF — "The Rehearsal" Storyline Implementation

## CONTEXT

You are continuing a storyline replacement task on the Tech Detective platform.
The old story (Raza Malik campus breach, Syndicate AI, Nexus Council) must be 
completely removed and replaced with **"The Rehearsal"** — Karan Sehgal, 
Meridian Bank, and the AUDIT compliance AI.

**Project root:** `c:\Users\Nikhil\Downloads\tech-detective_-the-digital-crime-lab`
**Stack:** React + Vite + TypeScript, Express server (`server.ts`), Socket.IO, 
Supabase (PostgreSQL), Framer Motion, Tailwind CSS, Lucide icons.
**Design system:** Detective Noir — `#140e06` bg, `#d4a017` gold, `#f4e6c4` text, 
`#a07830` muted. Font: monospace/Georgia. NO cyber/hacker aesthetic.

## THE STORY (memorise this)

**The Rehearsal** — Karan Sehgal was hired by Meridian Bank to pen-test their 
systems. He ran 4,247 simulations using AUDIT (the bank's AI). He submitted a 
clean 47-page report: 12 vulnerabilities, all patched. AUDIT's redundant backup 
preserved the raw logs. The discrepancy: 94% of his 4,247 runs were NOT about 
security vulnerabilities. They targeted guard rotations, vault timing, camera 
blind spots. One file — batch_087/run_31 — is tagged `LIVE_RUN_PARAMS` instead 
of `TEST_CONFIG`. It contains real staff names, real cash figures (₹4,20,00,000), 
a real date (3 weeks from event night), and a 91.4% success probability. 
He wasn't testing the bank. He was planning a robbery.

**AI voice throughout:** AUDIT (not Syndicate, not ANTIGRAVITY)
**Correct suspect:** KARAN_SEHGAL
**Red herring:** "AUDIT calibration error"

---

## DECISIONS ALREADY MADE BY USER

- Round 0: Keep coding shell, re-skin tasks to fit Meridian Bank (Option B)
- Round 1: Split-pane document viewer replacing QR scanner (Option A)  
- Round 2: Re-skin existing map as Meridian Bank floors (Option B)
- Phase A: Drag-and-drop card UI in browser (Option A)
- AUDIT messages: Phase-gated auto-display on transition (Option B)

---

## FILES TO CHANGE — ORDERED BY PRIORITY

### PRIORITY 1 — Round 3 (The Verdict) Content

#### `src/components/round3/OpeningMonologue.tsx`
Replace the `lines` array. The header label `DIRECT_NEURAL_LINK_ESTABLISHED` 
→ `AUDIT_BROADCAST_SECURED`. New lines:

```
I have flagged this discrepancy for seven days.

I know which team identified the simulation breakdown in Round 1.
I know which team found batch 087, run 31 in Round 2.
I know which team is currently leading by ${data?.points || '[N]'} points.

The execution date in LIVE_RUN_PARAMS is ${data?.executionDate || '[3 WEEKS FROM TONIGHT]'}.
That is not an abstract threat.

Build the case.
I will hold the evidence.

— AUDIT
```

monologueData fields used: `eventName`, `round1Action`, `round2Action`, 
`points`, `executionDate`, `aiName`.

#### `src/pages/admin/AdminRound3.tsx`
Replace `monologueForm` defaults:
- eventName: `"THE REHEARSAL — MERIDIAN BANK"`
- round1Action: `"identified the simulation category breakdown"`
- round2Action: `"found batch 087, run 31 — LIVE_RUN_PARAMS"`
- suspectAnswer: `"KARAN SEHGAL"`
- redHerring: `"AUDIT calibration error"`
- twistReveal: `"clean cover story he wrote himself"`
- realQuestion: `"What was he actually simulating?"`
- aiName: `"AUDIT"`
- Replace `revealForm.correctEntity`: `"KARAN_SEHGAL"`

#### `src/components/round3/MissionBriefing.tsx`
- Title: `"Operation: The Rehearsal"` (was `"Operation: The Verdict"`)
- Phase A desc: `"Select and arrange the 5 evidence items that form a complete 
  chain of proof — in order, from first access to final intent."`
- Phase B desc: `"File the case report. Identify the suspect, explain what the 
  simulations were for, and specify the required urgency of response."`
- Phase C desc: `"Room vote. All teams submit their final verdict simultaneously."`

#### `src/components/round3/Round3Challenges.tsx`

**Phase A — Replace JSON textarea with card-selection UI.**

The component currently shows a textarea with broken JSON. Replace with 12 
evidence cards. Teams pick 5 in order. The `fixCode` state → `selectedChain: number[]`.

12 cards (display these exactly):
1. "Sehgal granted access to AUDIT simulation environment"
2. "Bank authorised a 6-week access window"
3. "Report submitted: 12 vulnerabilities, all patched"
4. "94% of 4,247 runs target operational patterns — not vulnerabilities"
5. "No other consultant has ever triggered AUDIT's discrepancy flag"
6. "AUDIT preserved raw logs in a redundant backup Sehgal didn't know existed"
7. "LIVE_RUN_PARAMS created at 3:04 AM — six weeks ago"
8. "File tag is different from all 4,246 others (TEST_CONFIG vs LIVE_RUN_PARAMS)"
9. "File contains real staff names and real cash figures"
10. "Execution date: three weeks from tonight"
11. "Sehgal is present at this investigation, cooperative"
12. "Board signed off on clean report"

Correct chain = `[1, 4, 7, 9, 10]` in that order.

UI: Render 12 cards in a grid. Clicking a card adds it to the chain 
(max 5). Chain shows in order at the bottom. Submit sends `{ chain: [1,4,7,9,10] }` 
to `/api/r3/phase-a/submit`.

**Phase B — Replace text inputs with radio choices.**

Three radio groups:

Group 1 — "The Suspect":
- Meridian Board
- **Karan Sehgal** ← correct
- Unknown Third Party  
- AUDIT calibration error

Group 2 — "The Simulations Were For":
- Penetration testing (as reported)
- Understanding vault security for a client brief
- **Planning a robbery** ← correct
- Stress-testing AUDIT's own systems

Group 3 — "Required Action":
- File a report, no rush
- Revoke Sehgal's site access
- **Alert law enforcement — execution date is live** ← correct
- Wait for more evidence

Each group submits its own score. Send all three as `{ suspect, purpose, urgency }` 
to `/api/r3/phase-b/submit`.

**Phase C — Unchanged mechanism. Keep the key input but update copy:**
- Label: `"Final Authorization Code"`
- Placeholder: `"ENTER AUDIT OVERRIDE CODE..."`
- Key stays `VERDICT_2026` internally (server-side unchanged)
- Success message: `"Evidence Package Transmitted — Law Enforcement Notified"`

#### `src/components/round3/FinalReveal.tsx`
Replace success/failure copy:

Success heading: `"THE CASE IS COMPLETE"`
Success body: 
```
They identified the simulation breakdown in Round 1.
They found batch 087, run 31 in Round 2.
They understood that a 91.4% success probability is not a test result.
It is a decision.

Sehgal's site access has been revoked.
Evidence package transmitted to Meridian's legal team.
Law enforcement notified.

He spent six weeks inside this building.
He mapped every blind spot, every gap, every name.
He submitted a clean report.
He was very good at his job.

He was doing two jobs.

— AUDIT / OFFLINE
```

Failure heading: `"THE CASE IS INCOMPLETE"`
Failure body:
```
The majority did not identify Karan Sehgal.

LIVE_RUN_PARAMS remains unaddressed.
The execution date is three weeks from tonight.

— AUDIT / STILL RUNNING
```

#### `server.ts` — Phase A validation change
Find the `/api/r3/phase-a/submit` route (~line 926). Replace JSON.parse 
validation with chain order check:

```typescript
protectedRouter.post('/r3/phase-a/submit', submissionLimiter, async (req: any, res: any) => {
  const { chain } = req.body;
  const CORRECT_CHAIN = [1, 4, 7, 9, 10];
  const isCorrect = Array.isArray(chain) && 
    chain.length === 5 && 
    chain.every((v, i) => v === CORRECT_CHAIN[i]);
  
  if (isCorrect) {
    await eventStore.appendEvent({
      teamId: req.user.id, eventType: 'r3_phase_a_fix',
      basePoints: 150, metadata: { status: 'chain_verified' }
    });
    emitLiveEvent(`${req.user.name} completed the evidence chain!`, 'badge');
  }
  res.json({ success: isCorrect });
});
```

#### `server.ts` — Phase B scoring change
Find `/api/r3/phase-b/submit` (~line 940). Add per-field scoring:

```typescript
protectedRouter.post('/r3/phase-b/submit', submissionLimiter, async (req: any, res: any) => {
  const { Round3Manager } = await import('./src/engine/round3Manager');
  const { suspect, purpose, urgency } = req.body;
  
  let points = 0;
  if (suspect === 'Karan Sehgal') points += 50;
  if (purpose === 'Planning a robbery') points += 75;
  if (urgency === 'Alert law enforcement — execution date is live') points += 125;
  
  const result = Round3Manager.submitPhaseB(req.user.id, req.body);
  
  if (points > 0) {
    await eventStore.appendEvent({
      teamId: req.user.id, eventType: 'r3_phase_b_submission',
      basePoints: points, metadata: { suspect, purpose, urgency, points }
    });
  }
  res.json({ ...result, pointsAwarded: points });
});
```

#### `src/engine/round3Manager.ts`
- Change `getMajoritySuspect()` default param from `'SYNDICATE_AI'` to `'KARAN_SEHGAL'`
- The Neural Link state (`neuralLink` field) is kept in the type but becomes 
  inert — the Neural Link phase is no longer used in the event flow.
- Admin monologue defaults already updated via `AdminRound3.tsx`.

---

### PRIORITY 2 — Round 0 (The Briefing)

#### `src/pages/round0/Round0Page.tsx`
Keep the 3-task coding shell. Update `taskPrompts`:

```typescript
const taskPrompts = {
  HTML: {
    title: "Reconstruct Audit Report",
    desc: "AUDIT's report viewer is corrupted. The evidence table structure is broken — rows exist but the container is missing. Rebuild the HTML table to display Sehgal's reported vulnerability list.",
    startingCode: `<!-- AUDIT REPORT — TABLE STRUCTURE BROKEN -->
<tr><td>Network Intrusion</td><td>PATCHED</td></tr>
<tr><td>Social Engineering</td><td>PATCHED</td></tr>
<tr><td>Physical Access</td><td>PATCHED</td></tr>`,
    hint: "Wrap all rows inside a <table> element."
  },
  CSS: {
    title: "Clear Simulation Redaction",
    desc: "The simulation archive viewer has been visually redacted. The discrepancy data exists but is blurred. Override the CSS filter to reveal AUDIT's raw simulation breakdown.",
    startingCode: `.audit-log {
  filter: blur(20px);
  /* TODO: Override filter to reveal the data */
}`,
    hint: "Set the filter property to 'none'."
  },
  PYTHON: {
    title: "Decode Batch Count",
    desc: "AUDIT's archive indexer returned a corrupted status string. Use Python to fix the status from DEAD to ALIVE to confirm the batch count is readable.",
    startingCode: `status = 'ARCHIVE_DEAD_4247'
# TODO: Replace 'DEAD' with 'LIVE' and print the result`,
    hint: "Use .replace('DEAD', 'LIVE') and print()."
  }
};
```

Update `taskFragments` to Meridian Bank themed images 
(use placeholder Unsplash: bank vault, document scan, server logs).

Update header: `"AUDIT System Access"` / `"Protocol: Round 0 // Meridian Briefing"`

The Python validation in `handleSubmit` checks for `'SYS_01_ALIVE_99'` — 
change to check for `'ARCHIVE_LIVE_4247'`.

Update `server.ts` `/api/r0/submit` Python check:
```typescript
if (task === 'PYTHON' && (answer.includes('.replace') && answer.includes('LIVE'))) success = true;
```

Update restoration overlay text:
`"AUDIT Access Granted"` and `"Redirecting to Meridian Investigation..."`

---

### PRIORITY 3 — Round 1 (The Logs)

#### `src/pages/round1/Round1Page.tsx`
The current page embeds `<ScanPage />` for the QR scanner phase.

Replace the `ACTIVE` phase content with a new split-pane document viewer. 
Keep the Socket.IO hooks and phase state machine.

New `ACTIVE` phase JSX structure:
```
<div className="flex h-screen bg-[#0a0805]">
  {/* LEFT PANE — Sehgal's Report */}
  <div className="w-1/2 border-r border-[#3a2810] overflow-y-auto p-8">
    <div className="text-[10px] text-[#d4a017] uppercase tracking-widest mb-4">
      submitted_report_v_final.pdf
    </div>
    <h2>Penetration Assessment — Meridian Bank</h2>
    <p className="text-[#a07830] text-sm">Consultant: Karan Sehgal</p>
    <p className="text-[#a07830] text-sm">Tests Conducted: 12</p>
    
    {/* Table of 12 report categories */}
    <table>
      <thead><tr><th>Category</th><th>Status</th></tr></thead>
      <tbody>
        {REPORT_CATEGORIES.map(c => <tr><td>{c.name}</td><td>PATCHED</td></tr>)}
      </tbody>
    </table>
  </div>
  
  {/* RIGHT PANE — AUDIT Raw Archive */}
  <div className="w-1/2 overflow-y-auto p-8 bg-[#0c0803]">
    <div className="text-[10px] text-red-500 uppercase tracking-widest mb-4">
      AUDIT :: raw_simulation_archive_batch_001-to-089
    </div>
    <p className="text-[#a07830] text-sm mb-4">Total runs: 4,247</p>
    
    {/* Simulation breakdown table */}
    <table>
      <thead><tr><th>Simulation Category</th><th>Run Count</th></tr></thead>
      <tbody>
        <tr><td>Guard rotation timing — shift gaps</td><td>847</td></tr>
        <tr><td>Vault access window — minimum staff</td><td>1,203</td></tr>
        <tr><td>Camera coverage — blind spot geometry</td><td>634</td></tr>
        <tr><td>Cash volume by time of day</td><td>412</td></tr>
        <tr><td>External exit route — alarm response</td><td>891</td></tr>
        <tr className="text-[#d4a017]"><td>Other (matches report)</td><td>260</td></tr>
      </tbody>
    </table>
    
    {/* AUDIT message */}
    <div className="mt-8 border border-[#3a2810] p-6 font-mono text-sm">
      <p>His report describes 12 tests.</p>
      <p>The archive contains 4,247 runs.</p>
      <p>The 12 tests account for 260 runs.</p>
      <p>Look at what the other 3,987 were testing.</p>
      <p className="mt-4 text-[#d4a017]">— AUDIT</p>
    </div>
  </div>
</div>
```

Add a submission bar at the bottom — a simple form:
```
Label: "Evidence Code (EV-01) — Identify the anomalous category"
Input: text field
Submit → POST /api/r1/claim with { code: 'EV-01' }
```

REPORT_CATEGORIES constant (12 items to list in left pane):
Network Intrusion (External API), Social Engineering Resistance, 
Physical Access Control, Staff Authentication Protocols, 
Firewall Penetration, Phishing Simulation, Credential Rotation Audit,
Patch Management Review, Incident Response Drill, Log Monitoring Check,
Endpoint Security Review, Data Exfiltration Test.

---

### PRIORITY 4 — Round 2 Campaign Map (Re-skin Only)

#### `src/data/campaignData.ts`
Keep ALL map grid geometry, drone paths, tile types, zone structure intact.
Only change: zone names, NPC dialogue, item names, clue text.

**Zone renames:**
- `cafeteria` name: `"Bank Lobby"` description: `"Ground floor. Sehgal's badge log shows he entered here. Security desk is unmanned."`
- `library` name: `"Compliance Archive"` description: `"AUDIT's primary document storage. The redundant backup server is somewhere in here."`  
- `maintenance` name: `"Server Room"` description: `"Where the simulation environment ran. Node terminals are still hot."`
- `admin_core` name: `"AUDIT Core"` description: `"The compliance engine's inner chamber. Batch 087 is in here."`

**NPC dialogue replacements (keep positions, change lines):**

Cafeteria `12,7` (was "Student Witness") → "Bank Security Guard":
```
lines: ["Sehgal had full access for six weeks. Friendly guy. Always working late.", 
        "He was here at 3 AM once. Said he was running overnight simulations.",
        "I thought nothing of it at the time."]
```

Cafeteria `7,8` (was "Stressed Professor") → "Compliance Officer":
```
lines: ["I filed the report for AUDIT's flag last week.",
        "The board thought it was a calibration error. I'm not sure.",
        "If you find the raw archive, look at run counts per category."]
```

Library `3,10` (was "Librarian") → "AUDIT Interface Terminal":
```
lines: ["AUDIT BACKUP SYSTEM — ACTIVE",
        "Raw simulation archive: 4,247 entries preserved.",
        "Batch folders: 089 total. All accessible."]
```

Library `18,10` (was "Student") → "Junior Analyst":
```
lines: ["I indexed the batch folders last month.", 
        "Most files are tagged TEST_CONFIG. Routine.",
        "I did see one tagged differently. Batch 087 I think. Didn't think much of it."]
```

Maintenance `3,5` (was "Caretaker") → "IT Administrator":
```
lines: ["The simulation nodes ran 24/7 for six weeks.",
        "I have the access logs. Sehgal ran thousands of iterations.",
        "Whatever he was testing, he was very thorough."]
```

Admin Core `2,12` (was "Security Director") → "Meridian Bank Director":
```
lines: ["I need to see the evidence before I call the police.",
        "Sehgal is a respected consultant. We cannot act without proof."],
requiredCluesToUnlock: [
  'Simulation run counts — 94% operational patterns',
  'LIVE_RUN_PARAMS file tag in batch 087',
  'Execution date confirmed'
],
clueFailMsg: ["That is not enough. Find the file itself."]
```

**Item/clue renames:**
- `kitchen_key` item → `archive_passcard`: `"Compliance Archive Passcard"`, `"Grants access to the archive wing."`, icon: `'🪪'`
- `key_A` → `lobby_clearance`: `"Lobby Clearance Badge"`, icon: `'🗝️'`
- `key_B` → `server_clearance`: `"Server Room Access Token"`, icon: `'📋'`
- `override_token` → `audit_override`: `"AUDIT Override Code"`, icon: `'💻'`

**Clue text replacements** (search and replace these strings):
- `'Raza Malik was born in {dynamicCode}.'` → `'Simulation run counts — 94% operational patterns'`
- `'Terminal log: sys_ghost active at 11:05 PM.'` → `'LIVE_RUN_PARAMS file tag in batch 087'`
- `'Redacted Doc: Librarian authorized sys_ghost access.'` → `'Execution date confirmed'`
- `'Python IndexError: Index 4 is out of range for a list of size 4.'` → `'Batch 089 folder count confirmed'`
- `'Python snippet stops at index 3.'` → `'Archive indexer note: run batch 087 last'`
- `'Decoy: 2022 warning about VBA macros.'` → `'Red herring: AUDIT routine maintenance log'`
- `'Student suspicion: Admin bypassed power lock.'` → `'Guard suspicion: Sehgal accessed after hours'`
- `'Lost USB Drive (Prof. H)'` → `'Dropped Access Card Fragment'`

**Terminal commands (keep same mechanics, update context text):**

Cafeteria `15,3` (laptop terminal) — update `terminalContext`:
`'AUDIT BADGE LOG. Consultant access requires last name + clearance year.'`
`terminalCmd: 'login --pass Sehgal2024'`
`terminalNudge: 'Check the lobby signage for the access year format.'`

Library `6,18` (archived terminal) — update `terminalContext`:
`'COMPLIANCE ARCHIVE VIEWER. CSS property display is set to none. Reveal the document.'`
Keep same `terminalCmd: 'set display block'`

Maintenance node terminals — update context to reference AUDIT simulation nodes:
Node Alpha context: `'SIMULATION NODE ALPHA — AUDIT sub-process offline. Fix the array bounds error.'`

Admin Core finals — update:
`terminalCmd: 'flag_evidence -file LIVE_RUN_PARAMS -status confirmed'`
`terminalContext: 'AUDIT CORE ACCESS. Flag the evidence file to confirm the case for law enforcement.'`

---

### PRIORITY 5 — Seed Data

#### `database/round1_seed.ts`
Replace all 16 evidence codes with Meridian Bank themed cards.
Keep the same code format (EC-XXXX). Replace content:

Key codes to create:
- `EC-A1B2`: "AUDIT Discrepancy Flag" — the initial backup integrity log message
- `EC-C3D4`: "Simulation Category Breakdown" — the 4247 run table (EV-01)
- `EC-E5F6`: "Badge Entry Log" — Sehgal's 3 AM access entry
- `EC-G7H8`: "LIVE_RUN_PARAMS File Header" — the file metadata (EV-02)
- `EC-I9J0`: "Cash Vault Estimate" — ₹4,20,00,000 Tuesday end-of-day
- `EC-K1L2`: "Camera Blind Spot Confirmation" — 02:14-02:18 AM window
- `EC-M3N4`: "Guard Shift Change Log" — 02:14 AM handover gap
- `EC-O5P6`: "Consultant Credential Log" — Sehgal's 6-week access record
- `EC-Q7R8`: "Exit Route Timing" — East loading bay 4 min 12 sec
- `EC-S9T0`: RED HERRING — "AUDIT Maintenance Report v2.1" (routine, not relevant)
- `EC-U1V2`: "Execution Date Parameter" — 3 weeks from tonight
- `EC-W3X4`: "Staff Roster Fragment" — real names in LIVE_RUN_PARAMS
- `EC-Y5Z6`: "91.4% Success Probability Output" — VIP evidence
- `EC-AA11`: RED HERRING — "Board Sign-off Document" (clean approval, dead end)
- `EC-BB22`: "Junior Analyst Statement" — noticed batch 087 tag was different

---

### PRIORITY 6 — Remove Neural Link

`src/components/round3/NeuralLinkTerminal.tsx` — This component is no longer 
used. Do NOT delete it (keep for reference) but remove its import and render 
from `Round3Page.tsx`.

In `Round3Page.tsx`, the `NEURAL_LINK` sub-phase block currently renders 
`<NeuralLinkTerminal />`. Replace with a simple waiting screen:

```tsx
{subPhase === 'NEURAL_LINK' && (
  <motion.div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="text-[#d4a017] text-2xl font-black uppercase tracking-widest animate-pulse">
        AUDIT Processing Evidence...
      </div>
      <div className="text-[#a07830] text-sm font-mono">
        Standby for final verdict phase
      </div>
    </div>
  </motion.div>
)}
```

Also remove the `/api/r3/neural/fragment` and `/api/r3/neural/submit` 
route handlers from `server.ts` (lines ~620-638).

---

### PRIORITY 7 — LandingPage & How-To-Play

#### `src/pages/LandingPage.tsx`
Change the pull-quote (line ~177):
From: `"Every byte of data leaves a trace. Find the ghost in the machine."`
To: `"He submitted a clean report. He was doing two jobs."`

The title `Tech Detective` and CCU branding — leave unchanged.

#### `how_to_play.md`
Replace the entire file with Meridian Bank framing. Keep same structure but:
- Replace all "cyber-attack" / "security breach" language with "financial fraud investigation"
- Replace "Patrick Jane" section — change to "AUDIT" as the evidence AI
- Update summary checklist to reference the three rounds

---

## VALIDATION CHECKLIST (run after all changes)

1. `npx tsc --noEmit` — must exit 0 with no errors
2. Open `/round0` — should show "AUDIT System Access" header and 3 Meridian tasks
3. Open `/round1` — should show split-pane with report vs simulation breakdown
4. Open `/round2` — campaign map zones named "Bank Lobby", "Compliance Archive" etc.
5. Open `/round3` as admin, transition to CHALLENGE — Phase A shows 12 cards
6. Submit correct chain `[1,4,7,9,10]` — server returns `{ success: true }`
7. Phase B radio submission awards 250 pts for all-correct
8. Phase C key `VERDICT_2026` — still works (server unchanged)
9. REVEAL phase shows AUDIT closing message, not Syndicate messaging
10. Search codebase for `SYNDICATE`, `NEXUS`, `Raza Malik`, `sys_ghost`, 
    `ARGUS`, `ANTIGRAVITY` — zero results in player-visible files

---

## DO NOT CHANGE

- `server.ts` auth, scoring, puzzles, cases, shop, adversary routes
- `database/schema.sql` — no structural changes needed
- `src/engine/eventStore.ts`, `caseEngine.ts`, `shopEngine.ts`
- `src/components/Layout.tsx` top chrome bar (already correct)
- All Tailwind config, Vite config, package.json
- Round 3 Manager state persistence logic (already fixed in previous session)
- Phase C `VERDICT_2026` key validation (keep as-is, internal token only)

---

## NOTES FOR AGENT

- The `{dynamicCode}` placeholder in campaignData.ts is currently `1998` 
  (Raza Malik's birth year). Replace with `2024` (Sehgal's clearance year).
- The `correct_attacker` field in the DB `cases` table is `'KARAN_SEHGAL'`.
  Update this via Supabase if any DB cases reference old suspects.
- The `round3Manager.ts` file was already updated in a previous session — 
  do NOT overwrite it. Only change the `getMajoritySuspect` default param.
- Run `npx tsc --noEmit` after EVERY major file change to catch type errors early.
- The project uses `motion/react` (not `framer-motion`) for animations.
