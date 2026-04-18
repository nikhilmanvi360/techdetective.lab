# Tech Detective: Digital Crime Lab
## UI/UX & Frontend Architecture Guide

This document provides a comprehensive overview of the frontend architecture, design language, and user experience paradigms used in the "Tech Detective" platform.

---

### 1. Design Philosophy: "Industrial Cyber-Ops Terminal"
The platform eschews modern consumer-facing design trends (like extreme glassmorphism or white-space heavy layouts) in favor of a **tactical, retro-futuristic terminal aesthetic**. 

**Core Visual Principles:**
* **High Contrast Colors:** Deep blacks (`#050505`) contrasted with stark neon accents: Cyber Green (success/primary), Amber (warnings/hints), and Red (errors/adversary).
* **Flat Holographic Panels:** Components avoid heavy drop-shadows. Instead, they use thin neon borders, translucent overlays (`bg-black/80`), and dashed corner accents (`corner-brackets`) to mimic military/hacker heads-up displays (HUDs).
* **Typography:** 
    * `Space Grotesk` (or similar display font) for bold, tracking-heavy headers.
    * `Fira Code` (or default monospace) for dense telemetry, logs, and system data.
* **Immersive Visual Artifacts:** CSS-driven scanlines, floating background particles, and intense keyframe animations like `.glitch-text` and `.flicker-anim` bring the terminal to life.

---

### 2. Frontend Technology Stack
* **Core Framework:** React 18 + TypeScript bundled via Vite for lightning-fast HMR and optimized production builds.
* **Routing:** `react-router-dom` utilizing a unified `<Layout />` wrapper to maintain global HUD elements across page navigations.
* **Styling:** Tailwind CSS. Highly customized via `index.css` to introduce specific tactical utility classes (`.cyber-panel`, `.neon-border-green`).
* **Animations:** `motion/react` (Framer Motion) powers smooth component mounting, spring-physics modal drops, and page transition crossfades.
* **Iconography:** `lucide-react` for crisp, consistent, and SVG-lightweight system icons.
* **Data Visualization:** `recharts` for the Admin Analytics dashboard (bar charts for team scores).
* **Real-time WebSockets:** `socket.io-client` attached to hooks to instantly react to backend events (Live Ticker and Adversary interventions).

---

### 3. Key UX Features & Hooks

#### **Audio Feedback (`useSound.ts`)**
The platform features an integrated Web Audio API synthesiser. Every interaction (clicks, page loads, terminal processing) outputs a mechanical/electronic auditory response. This drastically increases the perceived "tactile" feel of the web interface without requiring external `.mp3` assets.

#### **Adversary System (`useAdversary.ts`)**
A custom hook that listens to the `socket.io` feed. When the Game Master triggers an Adversary event, this hook hijacks the highest Z-index of the DOM to render:
* **Signal Interference:** A violently shaking Red overlay with static patterns that temporarily restricts visual clarity.
* **Guidance Banners:** Intrusive top-down banners presenting hints to struggling teams.

#### **Live Global State (`LiveTicker.tsx`)**
A persistent bottom-anchored ticker running across all screens. It consumes the WebSocket stream to give players real-time feedback on what other teams are accomplishing (e.g., "Team XYZ solved Case 2"), establishing a high-pressure, competitive atmosphere.

---

### 4. Page Architecture Summary

* **`Layout.tsx`**: The master container. It controls the persistent Top Navigation bar, the ambient floating `ParticleField`, the `LiveTicker`, and all global Adversary visual triggers.
* **`Dashboard.tsx`**: The entry point presenting the available Cases as interactive "Nodes". Uses grid layouts and hover effects to emulate a target-selection screen.
* **`CaseDetail.tsx`**: The core gameplay loop. It dynamically merges static puzzle data with the new `caseEngine` state. Features include hiding evidence behind puzzle locks, rendering countdown lockouts for rapid incorrect guesses, and slowly revealing hints after time delays.
* **`EvidenceViewer.tsx`**: A dedicated modal/page for inspecting raw data. Supports the Adversary's "Encrypted" state, rendering a glitching text overlay that players must bypass using XP via the "De-Ice" mechanic.
* **`Scoreboard.tsx`**: A live-updating leaderboard supplemented with an active multiplier banner (e.g., matching the Admin's "2x XP Window").
* **`AdminDashboard.tsx`**: A dense, multi-tab command center. Relies strictly on `Promise.all` data syncing to populate massive data tables for Submissions, Case Management, Team Overrides, Event Logs, and the Adversary Manual-Trigger Panel.

---

### 5. Performance Considerations
* All heavy visual effects (scanlines, particles) use pure CSS keyframes on hardware-accelerated properties (`opacity`, `transform`) to avoid main-thread jank, allowing smooth React interactions even on lower-end hardware.
* Dynamic state updates (like countdown timers) strictly use localized React state or CSS variables to prevent unnecessary re-rendering of the massive global DOM tree.
