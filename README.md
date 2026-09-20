# 🦁 Premier League Fantasy Football (FPL)

A fullstack, mobile-focused web application that replicates the official Fantasy Premier League (FPL) game experience — with live pitch graphics, formation mechanics, chips, transfers, scoring engine, and a **Developer Portal** for match data entry.

Built for friends to play together in shared leagues with live scores and rankings.

---

## 🌟 Features

- **Mobile-First Experience**: Designed specifically for smartphone screens with app-like bottom navigation, smooth action sheets, and desktop ambient frame.
- **Official Pitch View**: Striped grass pitch with chalk lines, authentic club kit jerseys, dynamic formations (3-4-3, 4-4-2, 3-5-2, 5-3-2), and bench dugout.
- **Complete FPL Scoring Engine**:
  - Goals: GKP/DEF (6 pts), MID (5 pts), FWD (4 pts).
  - Assists: 3 pts.
  - Clean Sheets: GKP/DEF (4 pts), MID (1 pt).
  - Goals Conceded: -1 pt per 2 conceded for GKP/DEF.
  - Saves: 1 pt per 3 saves.
  - Auto-substitutions for 0-minute starters in priority bench order.
  - Captain (2x) and Vice-Captain failover.
  - Chips: Triple Captain (3x), Bench Boost, Free Hit.
  - Transfers: Free transfers tracking with -4 pt penalty for extra transfers.
- **Multi-Friend Support**:
  - Multiple friends can join, create their own manager profile, and manage their own team.
  - All managers compete in a shared Global League and private mini-leagues.
- **Developer Portal (`/dev`)**:
  - Protected with private admin password (server-verified, configurable via `ADMIN_PASSWORD` env var).
  - Live entry for Minutes, Goals, Assists, Clean Sheets, Cards, Saves, and Bonus Points.
  - Auto-Simulate Gameweek match results with 1 click.
  - Finalize Gameweek & advance schedule.
  - Add, edit, or delete footballers.

---

## 🚀 Quick Start (Local)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development**:
   ```bash
   # Terminal 1: Vite client
   npm run dev

   # Terminal 2: Express API backend
   npm run server
   ```
   Open `http://localhost:5173/` in your browser.

3. **Run fullstack production server locally**:
   ```bash
   npm run build
   npm start
   ```
   Open `http://localhost:3000/`.

---

## ☁️ Deploy to Render.com

This repository includes a `render.yaml` blueprint:

1. Push this repository to GitHub.
2. Go to [Render.com](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Select your `TheIulius/premier-league-fantasy` GitHub repository.
4. Render will automatically detect settings from `render.yaml`:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Click **Deploy Web Service** and your public URL will be live (e.g. `https://premier-league-fantasy.onrender.com`).
