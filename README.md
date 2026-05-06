# 🎮 RUG FUN — Solana Meme Trading Game

A real-time multiplayer meme token trading game. Trade $RUGFUN against friends and bots, survive whale dumps, and pray there's no rugpull.

## 🚀 Quick Start on Replit

1. Upload all files to your Replit project
2. Make sure `package.json` is in the root
3. Set the **Run command** to: `node server.js`
4. Click **Run** — the game will be live at your Replit URL

## 📁 File Structure

```
rugfun/
├── server.js          ← Node.js game server (WebSocket + HTTP)
├── package.json       ← Dependencies
└── public/
    └── index.html     ← Full game client (HTML/CSS/JS)
```

## ⚙️ Replit Setup

In your Replit `.replit` file (or Run button config):
```
run = "node server.js"
```

Dependencies auto-install from `package.json`:
- `express` — HTTP server + static files
- `ws` — WebSocket server
- `uuid` — Room/player IDs

## 🎮 Game Modes

### Single Player
- Play against 3–10 AI bots
- Bots have personalities: Sniper, Whale, FOMO, Paper Hands, Degen
- Immediate start

### Multiplayer (Host)
- Creates a 6-letter room code
- Share with friends to join
- Host controls when game starts
- Up to 50 players

### Multiplayer (Join)
- Enter the room code from the host
- Pick your character and name
- Wait for host to launch

## 🎯 Gameplay

- **Starting balance:** $100 each
- **Starting market cap:** $10,000
- **Duration:** 5–20 minutes (host configures)
- **Goal:** End with the highest net worth

### Trading
- Buy with $5, $10, $25, $50, or MAX
- Sell 25%, 50%, 75%, or 100% of holdings
- Every buy pumps the price
- Every sell dumps the price

### Events (Time-based, not every second)
- 📰 **News items** every 45–90 seconds
- 🤖 **Bot trades** every 8–25 seconds
- ⚡ **Random events** checked every 30 seconds:
  - 💀 Rugpull (2% chance) — everyone loses tokens
  - 🏦 CEX Listing (1.5% chance) — 5x pump
  - 🐦 Elon Tweet (2% chance) — 3.5x pump
  - 🐋 Mega Whale (2.5% chance) — 2.8x pump
  - ⚖️ SEC News (1.5% chance) — 70% crash
  - 🔓 Hack (1.5% chance) — 55% crash
  - 🦠 Viral Meme (2% chance) — 2.2x pump

## 🏆 Leaderboard

At game end:
- Podium with gold/silver/bronze
- Full rankings with P&L in $ and %
- Who won, who got rekt

## 🛠️ Customization

In `server.js` you can modify:
- `NEWS_POOL` — add your own news events
- `RANDOM_EVENTS` — change chances and multipliers
- `BOT_NAMES` — add new bot personalities
- Starting market cap: `marketCap: 10000`
- Starting price: `price: 0.0001`

## 🔒 Notes

- All trades are simulated — no real crypto
- No wallet connection needed
- Educational/entertainment only
- Server state resets on restart
