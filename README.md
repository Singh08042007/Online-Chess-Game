<div align="center">

# ♟️ Grandmaster Online Chess

**A Modern, Real-Time Online Chess Platform with AI, WebRTC Hand-Gesture Controls, and Multiplayer.**

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hand_Tracking-FF6F00?style=for-the-badge&logo=google)](https://mediapipe.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

[Live Demo](https://bestchessgame.vercel.app/) • [Features](#-features) • [Hand Gestures](#-camera-based-hand-gesture-controls) • [Installation](#-getting-started) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

**Grandmaster Online Chess** is a feature-rich, high-performance chess application built with **Next.js 15 App Router**, **TypeScript**, and **Tailwind CSS**. It combines traditional FIDE-compliant chess mechanics with cutting-edge web technologies — including **AI-driven touchless hand tracking** via your webcam, **low-latency multiplayer synchronization** powered by Supabase Realtime, and an **installable Progressive Web App (PWA)** experience across desktop and mobile devices.

---

## ✨ Features

### 🖐️ Camera-Based Hand-Gesture Controls (Touchless Play)
- **Computer Vision with MediaPipe Hands**: Control your chess pieces using just your hands and webcam without touching your keyboard or mouse.
- **Natural Gesture Recognition**:
  - ✊ **Closed Fist / Pinch**: Grab and pick up a chess piece.
  - 🖐️ **Open Hand**: Drop and release the piece onto the destination square.
  - 👆 **Pointing**: Hover over squares to preview legal moves.
- **Smart Ergonomic Calibration**: Includes generous vertical safety buffers (35% bottom margin) and knuckle-anchoring so your hand never leaves the camera view.
- **Interactive Skeleton HUD**: Real-time 21-joint skeleton tracking canvas with gesture confidence badges, laser reticle cursor, and sensitivity calibration slider.

### 🤖 Intelligent AI Opponent (Play vs Computer)
- **4 Distinct Difficulty Levels**:
  - 🟢 **Easy (Rating ~800)**: Casual play, rapid moves, forgiving blunders.
  - 🟡 **Medium (Rating ~1300)**: Tactical awareness, piece protection, basic opening development.
  - 🔴 **Hard (Rating ~1800)**: Multi-ply minimax search with alpha-beta pruning and positional piece-square tables.
  - 🟣 **Master (Rating ~2200+)**: Deep positional evaluation, piece coordination, and endgame technique.
- **Evaluation Bar**: Dynamic real-time advantage bar showing positional evaluation in centipawns or mate-in-N.

### 🌐 Real-Time Online Multiplayer
- **Supabase Realtime WebSockets**: Instant move transmission with sub-second latency.
- **Matchmaking & Private Rooms**: Quick 1v1 matchmaking or shareable 6-character room codes with instant invite links.
- **Spectator Mode**: Watch ongoing games live in real time.
- **Chat & Clock Controls**: Customizable time formats (1 min Bullet, 3 min Blitz, 5 min Rapid, 10 min Classical) with increment support.

### 📱 Progressive Web App (PWA) & Mobile Ready
- **Installable Native-Like App**: Add to Home Screen on iOS, Android, macOS, and Windows.
- **Offline Shell & Caching**: Custom service worker caching app assets for instant loading.
- **Fully Responsive UI**: Mobile-optimized touch board, bottom navigation, and adaptable layouts.

### 🎵 Procedural Web Audio Engine
- Built-in zero-dependency Web Audio synthesizer generating rich acoustic chess sound effects:
  - Piece moves, captures, castling, pawn promotions.
  - Check warnings, checkmate fanfare, and timer countdown ticks.

### 📊 Player Profiles, Elo Ratings & Replays
- **Elo Rating Engine**: Automatic post-match rating recalculation based on opponent strength.
- **Interactive Game Replay**: Step forward and backward through past matches move-by-move with FEN & PGN export.
- **Global Leaderboard**: Track top players by Elo rating, total wins, and win streaks.

---

## 🖐️ Camera-Based Hand Gesture Controls

| Gesture | Action | Description |
| :---: | :---: | :--- |
| 👆 **Pointing** | **Aim / Hover** | Point your index finger to highlight chess squares and inspect legal moves. |
| ✊ **Closed Fist** | **Grab Piece** | Close your hand over one of your pieces to pick it up and initiate dragging. |
| 🤏 **Pinch** | **Pinch Grab** | Pinch thumb and index fingers together as an alternative pickup gesture. |
| 🖐️ **Open Hand** | **Drop Piece** | Open all fingers wide over a legal highlighted square to execute the move. |

> **Note**: Camera Hand Control is exclusively enabled for desktop and laptop devices to ensure comfortable camera angles and optimal CPU performance.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack, Server Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom Glassmorphism Theme |
| **Backend & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime WebSockets) |
| **Computer Vision** | [Google MediaPipe Hands](https://mediapipe.dev/) + HTML5 Canvas 2D |
| **Chess Engine** | [chess.js](https://github.com/jhlywa/chess.js) + Custom Minimax Alpha-Beta Bot Engine |
| **Audio** | Custom Web Audio API Procedural Synthesizer |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18.0 or higher
- npm, pnpm, or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Singh08042007/Online-Chess-Game.git
cd Online-Chess-Game
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*(You can copy `.env.example` as a starting template)*

### 4. Setup Database Schema (Supabase)
1. In your [Supabase Dashboard](https://supabase.com/), open the **SQL Editor**.
2. Run the SQL script found in [`supabase/schema.sql`](supabase/schema.sql).
3. This creates all necessary tables (`profiles`, `games`, `game_moves`, `spectators`) along with Row Level Security (RLS) policies and realtime replication.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start playing!

---

## 🚢 Deployment (Vercel)

This repository is pre-configured for one-click deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. In the project settings, add the **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build the production bundle and serve the app over secure HTTPS (required for webcam permissions).

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

---

<div align="center">
  Crafted with ❤️ for chess lovers worldwide.
</div>
