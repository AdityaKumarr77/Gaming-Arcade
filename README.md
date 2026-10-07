# 🕹️ Arcade Arena – Online Tabletop & Board Games Lounge

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A modern, high-performance web gaming lounge featuring online-standard tabletop and board game classics with authentic physics, intelligent AI opponents, synthesized Web Audio acoustic feedback, and cyber-arcade aesthetics.

---

## 🎮 Featured Games

### 1. 🎲 Ludo Royale
- **Authentic 15×15 Board Geometry**: 4 colored corner bases (Red, Green, Yellow, Blue) with inner white yard housing and circular token pockets.
- **Center Glory Goal**: Four interlocking triangles converging at the center with a golden trophy crest.
- **Tournament Rules**: Roll a 6 to exit the yard, 8 official safe stars (★) immune to capture, knockout capture attacks, bonus rolls on 6/capture/home, and 3-consecutive-sixes forfeiture penalty.
- **Real 3D Pawns & 3D Rolling Dice**: Authentic dice faces with true pips (1–6 dots), tumble animation with rattling audio, and step-by-step hopping pawn movement along the track.
- **2–4 Players & Smart AI**: Play solo against intelligent AI bots or pass-and-play with friends.

### 2. ⚡ Tic Tac Toe Supreme
- **Neon Cyber Duel**: Glowing 3x3 cyber grid with animated SVG winning strike-through lines.
- **3 AI Personalities**: Novice Bot (casual play), Tactician (blocks wins & exploits tactical errors), and God Mode (unbeatable Minimax algorithm).
- **2-Player Duel**: Local pass-and-play with win streaks, custom scoreboard, and victory fanfare.

### 3. 🎯 Carrom Championship
- **2D Rigid-Body Elastic Physics**: Real kinetic energy transfer, friction deceleration, and edge cushion bouncing.
- **Interactive Striker Launcher**: Baseline positioning slider + drag-to-aim launcher with power meter and reflection trajectory bounce line preview.
- **Tournament Rules**: White (1 pt), Black (1 pt), Queen (3 pts) with cover rules, and striker pocketing foul penalties (-1 pt penalty).
- **Acoustic Wood Feedback**: Pitch-scaled wood clack sound effects proportional to impact collision velocity.

### 4. ♠️ VIP Blackjack 21
- **Luxury Casino Felt Table**: Curved emerald velvet felt table with gold embroidery.
- **Authentic Betting**: Multi-denomination casino chips ($5, $25, $50, $100, $500) with chip clink acoustics.
- **Vegas Dealer Rules**: Dealer hits on < 17 and stands on 17+. Natural 21 Blackjack pays 3:2.
- **Player Actions**: Hit, Stand, Double Down (2x wager for 1 card), and Insurance against dealer Ace.
- **Career Bankroll & Stats**: Persistent arcade wallet balance ($1,000 starting bankroll) with hands won, pushes, and dealer win tracker.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla Modern CSS (Glassmorphism, custom CSS variables, responsive design, `@media` queries)
- **Typography**: Google Fonts ([Outfit](https://fonts.google.com/specimen/Outfit) & [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans))
- **Audio Engine**: Synthesized [Web Audio API](src/audio/soundEffects.ts) — zero latency, 100% self-contained, no external MP3 dependencies
- **Celebration Effects**: Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AdityaKumarr77/Gaming-Arcade.git

# Navigate into the project directory
cd Gaming-Arcade

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
