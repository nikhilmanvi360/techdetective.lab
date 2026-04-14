# Tech Detective: The Digital Crime Lab

A web-based cybersecurity investigation game designed for students to learn basic forensics, log analysis, and logical deduction.

## Features
- **Immersive Cases:** Real-world inspired scenarios (e.g., Exam Portal Breach, Attendance System Hack).
- **Interactive Evidence:** Analyze HTML, CSS, Python, C code, server logs, and chat transcripts.
- **Progressive Puzzles:** Solve puzzles to unlock further evidence.
- **Live Scoreboard:** Real-time updates via WebSockets.
- **Admin Dashboard:** Manage teams, view analytics, and build new cases with a no-code UI.

## Hosting & Deployment

This project is built with React (Vite), Express, and SQLite. It is designed to be easily hosted on platforms like Google Cloud Run, Heroku, or a standard VPS.

### Prerequisites
- Node.js (v18+)
- npm

### Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`):
```env
JWT_SECRET="your-secure-random-string"
```

### Build for Production
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the frontend and backend:
   ```bash
   npm run build
   ```
3. Initialize the database (This will create `database/lab.db` and seed the initial cases):
   ```bash
   npx tsx database/init.ts
   ```

### Start the Server
```bash
npm start
```
The server will start on port 3000 (or the port specified by your hosting provider).

### Default Admin Account
To access the Admin Dashboard, log in with:
- **Team Name:** `admin`
- **Password:** `admin123`

*(Make sure to change the admin password or disable the default admin account in a real production environment!)*

## Data Persistence
The application uses SQLite (`better-sqlite3`). The database file is stored at `database/lab.db`. 
**Important for Cloud Hosting:** If you are deploying to an ephemeral environment like Docker or Cloud Run, any changes to the database (new users, scores, submissions) will be lost when the container restarts. You MUST mount a persistent volume to the `/database` directory to keep your data safe.
