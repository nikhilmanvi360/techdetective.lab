# Tech Detective: The Digital Crime Lab

## Core Concept
**Tech Detective** is an immersive, cyber-themed "Capture The Flag" (CTF) and technical treasure hunt platform. Designed to simulate the pressures of a high-stakes digital forensic investigation, the system forces users (split into competing "Teams") to unravel complex cybercrimes by analyzing raw data, decoding puzzles, and assembling evidence to identify the culprits.

The application operates under an **"Industrial Cyber-Ops Terminal"** visual aesthetic, complete with CRTs, neon grids, scanlines, and terminal typographies, immersing users in a gritty, high-tech hacking environment.

## Key Features & Mechanics

### 1. Case Resolution & The Evidence Board
- Teams investigate **Cases** (e.g., "The Phantom Leak", "Operation Digital Ghost").
- Cases are locked behind **Puzzles** and **Evidence** (logs, emails, code snippets). Teams must analyze the evidence to crack puzzle passwords. 
- Teams can physically map connections using the **Investigative Board**—a visual, draggable node link workspace for complex logic tracking.

### 2. Live Telemetry & Competition
- **Socket.IO Integration**: The environment is highly synchronized. When a team solves a puzzle, claims a "First Blood" bonus, or buys something, events are broadcasted globally via a live ticker at the top of the GUI.
- **Dynamic Leaderboard**: The scoreboard ("Tactical Rankings") auto-updates with real-time XP gains based on a team's speed and puzzle-solving accuracy.

### 3. The Adversary Engine
- A unique passive-aggressive mechanic where an automated AI (or "Adversary") actively tries to hack the players. 
- The Adversary can "scramble" evidence files, trigger visual UI glitches, or execute targeted lockouts to hinder team velocity. Teams have to clear these disruptions to continue working.

### 4. Shadow Market (The Black Market)
- XP isn't just for ranking; it's a currency.
- Teams can spend hard-earned points to buy specialized intel (decryption keys, adversary defenses) or deploy sabotage maneuvers to momentarily scramble opponents' terminals.

### 5. Patrick Jane: The Interactive Consultant
- An AI-powered virtual assistant built into the HUD using **Puter.js**.
- Patrick Jane acts as a deeply sarcastic, technical forensic mentor. He monitors the player's team name, current score, and what page they are on.
- He is specifically prompted to **never give direct answers**, but instead unpacks difficult technical jargon and pushes players to use standard forensic methodologies. 

## Technology Architecture

### **Frontend**
- **Framework**: React via Vite
- **Styling**: Vanilla CSS utilizing custom properties for dark mode neon aesthetics (cyber-green, cyber-red, cyber-blue) without heavy UI frameworks.
- **Animations**: Framer Motion for CRT flickers, tooltip popups, and the fluid layout routing.
- **Icons**: Lucide React 

### **Backend**
- **Server**: Node.js & Express
- **Database**: Supabase (PostgreSQL). The app recently migrated to Supabase from MongoDB/SQLite for fully-typed real-time data persistence.
- **Real-Time Mesh**: `socket.io` provides the web socket layer handling live ticker updates, cursor tracking on the investigation boards, and Adversary attacks. 

### **AI Services**
- **Puter.js**: Uses Puter.com's AI models to provide zero-latency text generation for the "Patrick Jane" contextual consultant.

## Operational Workflows
* **Admin Dashboard (CCU_ADMIN)**: A powerful interface to build cases, mint fresh puzzles, push evidence payloads, view live velocity analytics, and manually trigger Adversary actions.
* **Event Sourcing**: Every puzzle solve, hint use, and first-blood bonus is recorded as an immutable log via the internal EventStore, ensuring score integrity.
