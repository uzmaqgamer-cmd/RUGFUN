# RUG FUN

A multiplayer Solana meme token trading game where players buy/sell a randomly-picked trending meme token against bots and each other in real-time.

## Run & Operate
- **Start**: `node server.js` (port 5000)
- **Required env vars**: none

## Stack
- **Runtime**: Node.js
- **Server**: Express + `ws` WebSockets
- **Frontend**: Vanilla JS + HTML5 Canvas (no build step)
- **IDs**: `uuid` v9

## Where things live
- `server.js` — game engine, WebSocket handlers, room/bot/price logic
- `public/index.html` — entire frontend (HTML + CSS + JS in one file)

## Architecture decisions
- Single-file frontend avoids a build toolchain; canvas used for the candlestick chart
- Game state lives on the server; clients receive diffs via WebSocket broadcasts
- Order book is generated/animated client-side from price data (no server round-trip needed)
- Token is randomly selected from `TOKEN_POOL` (25 trending meme coins) at room creation and stored in room state; all news/event text has `$TOKEN` placeholder replaced dynamically
- Candles use 120-slot minimum grid so body width stays ≤7px (TradingView/pump.fun thin style) regardless of candle count; candles are right-aligned

## Product
- **Single Player** — trade against 3–10 configurable bots
- **Host Game** — create a room, share 6-letter code, up to 50 players
- **Join Game** — enter room code to join live session
- **Candlestick chart** — real-time canvas chart with TradingView-style thin candles, volume bars, OHLC toolbar, price tag
- **Order Book** — DEXscreener-style live bid/ask panel with depth bars in right sidebar
- **Random meme tokens** — PEPE, BONK, WIF, POPCAT, MOODENG, PNUT, BRETT, TURBO, FLOKI, MOG, GIGA, PONKE, FWOG, GOAT, NEIRO, SUNDOG, SLERF, MYRO, MAGA, BODEN, SMOLE, CHILLGUY, MICHI, RETARDIO, SIGMA
- **Random events** — rug pulls, CEX listings, Elon tweets, whale buys
- **Leaderboard** — podium + table at game end

## User preferences
- Candles should be thin like TradingView/pump.fun, not thick blocks
- Order book should look like DEXscreener (bids green, asks red, depth bars)
- Token name should be random meme coin each game, not always RUGFUN

## Gotchas
- Canvas chart doesn't render until `game_started` message received (candles populate from first price tick)
- Order book is purely synthetic/simulated — nudged on each price update for realism
