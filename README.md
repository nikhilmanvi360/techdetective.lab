# Tech Detective: The Digital Crime Lab

A web-based cybersecurity investigation game designed for students to learn basic forensics, log analysis, and logical deduction. Recently upgraded with an interactive AI consultant and migrated to a scalable, cloud-first architecture!

## Features
- **Immersive Cases:** Real-world inspired scenarios (e.g., The Zero-Day Syndicate, Attendance System Hack).
- **Interactive Evidence:** Analyze HTML, CSS, C/C++ code, Python scripts, server logs, and communications.
- **Progressive Puzzles:** Solve puzzles to uncover sequential dependencies and timed evidence reveals.
- **"Patrick Jane" AI Consultant:** A Gemini-powered AI companion built directly into the interface to assist detectives.
- **Live Scoreboard:** Real-time updates via WebSockets for competitive team events.
- **Admin Dashboard:** Manage teams, review analytics, and control the event timeline.

## Technology Stack
- **Frontend**: React (Vite), Tailwind CSS v4, Motion (Animations), Lucide React
- **Backend & API**: Express, Socket.IO, `@heyputer/puter.js`
- **Database**: Supabase (PostgreSQL) 
- **AI Engine**: Google Gemini AI (`@google/genai`)

## Hosting & Deployment

This application is designed to be easily hosted on platforms like Google Cloud Run, Heroku, Node VPS, or Render. 

### Prerequisites
- Node.js (v18+ or v22+)
- npm
- A [Supabase](https://supabase.com/) Project
- A [Google Gemini API Key](https://aistudio.google.com/)

### Environment Variables
Create a `.env` file in the root directory (you can use `.env.example` as a template):
```env
# Server & Authentication
JWT_SECRET="your-secure-random-string"
APP_URL="http://localhost:3000"

# AI Configuration
GEMINI_API_KEY="your-gemini-api-key"

# Database Configuration (Supabase)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Installation & Build
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project (compiles Vite frontend & backend):
   ```bash
   npm run build
   ```

### Database Initialization
With the migration to Supabase, you must seed the tables before running the app.
To seed the initial cases, puzzles, and the default admin:
```bash
npm run db:seed
# Or: npx tsx database/init.ts
```
*(Need a fresh start during an event? Run `npx tsx scripts/reinitialize_system.ts` to wipe all progress while preserving the Admin account).*

### Start the Server
For Development:
```bash
npm run dev
```

For Production:
```bash
npm start
```
The server will start on port 3000 by default.

### Default Admin Account
To access the Admin Dashboard, log in with:
- **Team Name:** `admin` (or `CCU_ADMIN`)
- **Password:** `admin123`

*(Make sure to change the admin password or disable the default admin account in a real production environment!)*

## Data Persistence
The platform seamlessly relies on Supabase for data layer, meaning any data added (new teams, scores, hints used, unlocked evidence) is durably saved in PostgreSQL. You can safely deploy this to ephemeral platforms (like Docker, Render, or Cloud Run) without worrying about data loss between container restarts!
