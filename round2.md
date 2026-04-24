# 🚀 PROJECT: Tech Detective Lab — Campaign Mode("round 2")

You are an expert full-stack engineer + game systems designer.

Build a **real-time multiplayer coding game** with a **fully connected map campaign**.

---

# 🧠 CORE CONCEPT

Players are investigators exploring a **connected campus map** to stop an AI system (ARGUS).

Gameplay loop:
👉 Explore → Interact → Collect → Infer → Solve → Unlock → Progress

---

# 🗺️ CAMPAIGN STRUCTURE

Single world divided into zones:

1. Cafeteria (Entry)
2. Library (Data Reconstruction)
3. Server Room (Logic + Power System)
4. Admin Core (Final AI Confrontation)

Zones unlock sequentially.

---

# 🧩 CORE SYSTEMS

## 1. Map Engine

* Grid-based (20x20)

* Tile types:

  * walkable
  * npc
  * terminal
  * locked_zone
  * power_node
  * core_terminal

* Player movement via keyboard

* Collision + boundary checks

---

## 2. Interaction Engine

When player presses "E":

* Detect tile at position
* Trigger:

  * NPC dialogue
  * no cyber,digital,dark theme
  * Unlock logic
  * Item collection

---

## 3. State Management

Maintain:

```json
{
  "inventory": [],
  "clues": [],
  "activated_nodes": [],
  "current_zone": ""
}
```

---

## 4. Progression System

* Gates require items
* Terminals require conditions
* Zones unlock dynamically

---

## 5. Case System (Integrated with Map)

Each interaction may contain:

* puzzle
* coding challenge
* dialogue
* reward

---

# 🎮 CAMPAIGN LOGIC

## 🟢 Zone 1 — Cafeteria

* Solve login anomaly
* Gain: key_A, clue "A-17"

## 🟡 Zone 2 — Library

* Reconstruct fragmented data
* Gain: key_B, clue "shift_3"

## 🔴 Zone 3 — Server Room

* Activate power nodes
* Avoid fake terminal
* Gain: override_token

## ⚫ Zone 4 — Admin Core

* Requires all previous items
* Final coding challenge
* AI interaction

---

# 🕵️ STORY SYSTEM (ARGUS AI)

* Show logs gradually hinting AI involvement
* Final reveal dialogue before last challenge

---

# 🎨 FRONTEND

Use:

* React (Vite)
* Tailwind
* Zustand
* Socket.io client

Build:

* Map Renderer
* HUD (inventory, clues, minimap)
* Interaction UI (NPC, terminal)

---

# ⚙️ BACKEND

Use:

* Node.js + Express
* Socket.io
* MongoDB
* Redis + BullMQ

Features:

* Room system
* Real-time sync
* Code execution queue (Piston)

---

# 🧠 WORKER

* Executes code securely
* Returns results
* Handles test cases

---

# 🛠️ ADMIN SYSTEM

Build:

* Visual map editor
* Tile placement
* Export JSON
* Case editor

---

# 🔁 MULTIPLAYER

* Players in same map
* Shared progress OR competitive mode
* Real-time leaderboard

---

# ⚠️ RULES

* No pseudo code
* Generate full working code
* Maintain modular structure
* Ensure everything connects

---

# 🎯 FINAL OUTPUT

Provide:

1. Full project structure
2. Frontend code
3. Backend code
4. Worker service
5. Map + campaign JSON
6. Setup instructions

---

Build step by step.
